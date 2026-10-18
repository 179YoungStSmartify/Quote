"""Offline tests of the actual publication shell; no network or real gh writes."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('package_app', ROOT / 'scripts/package_app.py')
assert spec is not None and spec.loader is not None
producer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(producer)
SHA = 'a' * 40
FAKE_GH = r'''#!/usr/bin/env python3
import json,os,pathlib,shutil,sys
args=sys.argv[1:]; root=pathlib.Path(os.environ['FAKE_REMOTE']); p=root/'state.json'; s=json.loads(p.read_text())
with (root/'calls.jsonl').open('a') as f:f.write(json.dumps(args)+'\n')
def save():p.write_text(json.dumps(s))
def bad():sys.exit(22)
def value(flag):return args[args.index(flag)+1]
if args[0]=='api':
    method=value('--method') if '--method' in args else 'GET'
    endpoint=next((x for x in args[1:] if x.startswith('repos/')), '')
    if '/commits/' in endpoint:
        if not s['exists']:
            print(json.dumps({'message':'No commit found','status':'422'}));sys.exit(1)
        print('b'*40 if s.get('moved') else os.environ['SOURCE_SHA'])
    elif '/git/ref/tags/' in endpoint:
        if not s['exists']:
            print(json.dumps({'message':'Not Found','status':'404'}));sys.exit(1)
        print(json.dumps({'object':{'sha':os.environ['SOURCE_SHA']}}))
    elif method=='DELETE':
        aid=int(endpoint.rsplit('/',1)[-1]);s['assets']=[a for a in s['assets'] if a['id']!=aid];save()
    elif method=='PATCH':s['draft']=False;s['prerelease']=True;save();print(json.dumps(s))
    elif '/releases/' in endpoint:
        if '--jq' in args:
            for a in s['assets']:print(a['id'])
        else:print(json.dumps(s))
    else:bad()
elif args[:2]==['release','view']:
    if not s['exists']:bad()
    if '--jq' in args:print(s['id'])
    elif '--json' in args:print(json.dumps({'isDraft':s['draft'],'isPrerelease':s['prerelease'],'tagName':s['tag_name'],'databaseId':s['id']}))
    else:print(s['tag_name'])
elif args[:2]==['release','create']:
    s.update(exists=True,draft=True,prerelease=True);save()
elif args[:2]==['release','upload']:
    for i,name in enumerate(['app.tar.gz','app-manifest.json'],10):
        shutil.copyfile(pathlib.Path('bundle')/name,root/name)
        s['assets'].append({'id':i,'name':name,'state':'uploaded'})
    save()
elif args[:2]==['release','download']:
    dest=pathlib.Path(value('--dir'));dest.mkdir(exist_ok=True)
    for name in ['app.tar.gz','app-manifest.json']:
        if not any(a['name']==name and a['state']=='uploaded' for a in s['assets']):bad()
        shutil.copyfile(root/name,dest/name)
else:bad()
'''

class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.root = Path(self.tmp.name)
        self.remote = self.root/'remote'; self.remote.mkdir()
        self.bin = self.root/'bin'; self.bin.mkdir()
        (self.bin/'gh').write_text(FAKE_GH); (self.bin/'gh').chmod(0o755)
        dist=self.root/'dist'; (dist/'assets').mkdir(parents=True)
        (dist/'index.html').write_text('<script src="/assets/app.js"></script>')
        (dist/'assets/app.js').write_text('console.log("fixture");')
        (dist/'quote.pdf').write_bytes(b'%PDF-1.7\nfixture')
        self.bundle=self.root/'bundle'; producer.package(dist,self.bundle,SHA)
        shutil.copyfile(ROOT/'scripts/package_app.py',self.bundle/'package_app.py')
        for name in ['app.tar.gz','app-manifest.json']:shutil.copyfile(self.bundle/name,self.remote/name)
        workflow=(ROOT/'.github/workflows/app-bundles.yml').read_text()
        self.script=textwrap.dedent(workflow.split('      - name: Verify bundle and publish to exact immutable release',1)[1].split('        run: |\n',1)[1])
    def tearDown(self):self.tmp.cleanup()
    def execute(self,kind='release',states=('uploaded','uploaded'),exists=True,draft=False,moved=False):
        tag='app-main-'+SHA if kind=='main' else 'v0.0.1'
        state={'id':1,'exists':exists,'tag_name':tag,'draft':draft,'prerelease':kind=='main','moved':moved,'assets':[{'id':i+1,'name':name,'state':status} for i,(name,status) in enumerate(zip(['app.tar.gz','app-manifest.json'],states))]}
        (self.remote/'state.json').write_text(json.dumps(state))
        work=self.root/'run';work.mkdir();(work/'bundle').symlink_to(self.bundle,target_is_directory=True)
        env=dict(os.environ,PATH=str(self.bin)+os.pathsep+os.environ['PATH'],FAKE_REMOTE=str(self.remote),SOURCE_KIND=kind,SOURCE_SHA=SHA,RELEASE_TAG=tag if kind=='release' else '',PUBLICATION_TAG=tag,REPOSITORY='TEST/NO-NETWORK')
        result=subprocess.run(['bash','-c',self.script],cwd=work,env=env,capture_output=True,text=True)
        calls=[json.loads(line) for line in (self.remote/'calls.jsonl').read_text().splitlines()]
        return result,calls,json.loads((self.remote/'state.json').read_text())
    def test_completed_stable_pair_is_never_overwritten(self):
        r,calls,_=self.execute();self.assertEqual(r.returncode,0,r.stderr)
        self.assertFalse(any('DELETE' in c or c[:2]==['release','upload'] for c in calls))
    def test_completed_main_pair_is_never_overwritten(self):
        r,calls,_=self.execute(kind='main');self.assertEqual(r.returncode,0,r.stderr)
        self.assertFalse(any('DELETE' in c or c[:2]==['release','upload'] for c in calls))
    def test_starter_pair_recovers_and_verifies_readback(self):
        r,calls,state=self.execute(states=('uploaded','starter'));self.assertEqual(r.returncode,0,r.stderr)
        self.assertEqual(sum('DELETE' in c for c in calls),2)
        self.assertTrue(any(c[:2]==['release','upload'] for c in calls))
        self.assertTrue(any(c[:2]==['release','download'] and 'readback' in c for c in calls))
        self.assertTrue(all(a['state']=='uploaded' for a in state['assets']))
    def test_one_asset_partial_recovers(self):
        r,calls,_=self.execute(states=('uploaded',));self.assertEqual(r.returncode,0,r.stderr)
        self.assertEqual(sum('DELETE' in c for c in calls),1)
    def test_draft_main_recovers_then_publishes(self):
        r,calls,state=self.execute(kind='main',states=('uploaded','starter'),draft=True);self.assertEqual(r.returncode,0,r.stderr)
        self.assertFalse(state['draft']);self.assertTrue(state['prerelease'])
        download=next(i for i,c in enumerate(calls) if c[:2]==['release','download'])
        patch=next(i for i,c in enumerate(calls) if 'PATCH' in c)
        self.assertLess(download,patch)
    def test_new_main_is_staged_and_verified_before_activation(self):
        r,_,state=self.execute(kind='main',states=(),exists=False);self.assertEqual(r.returncode,0,r.stderr)
        self.assertFalse(state['draft']);self.assertEqual(len(state['assets']),2)
    def test_moved_tag_fails_without_mutation(self):
        for kind in ['main','release']:
            with self.subTest(kind=kind):
                if (self.root/'run').exists():shutil.rmtree(self.root/'run')
                (self.remote/'calls.jsonl').unlink(missing_ok=True)
                r,calls,_=self.execute(kind=kind,moved=True);self.assertNotEqual(r.returncode,0)
                self.assertFalse(any('DELETE' in c or c[:2]==['release','upload'] for c in calls))
    def test_publish_lock_uses_validated_target_not_dispatch_inputs(self):
        workflow=(ROOT/'.github/workflows/app-bundles.yml').read_text()
        publish=workflow.split('  publish:',1)[1]
        group=next(line for line in publish.splitlines() if 'group:' in line)
        self.assertIn('needs.build.outputs.source_sha',group);self.assertIn('needs.build.outputs.release_tag',group)
        self.assertNotIn('inputs.',group)

if __name__=='__main__':unittest.main()
