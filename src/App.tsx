import { Fragment } from "react";
import { Shell, Section, Card } from "@perspective-living/react-ui";
import quoteData from "./quote.json";
import type { QuoteData } from "./types";
const q = quoteData as QuoteData;
const cents = (n: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: q.currency,
  }).format(n / 100);
const line = (x: { quantity: number; unitCents: number }) =>
  x.quantity * x.unitCents;
const sectionOriginal = (s: (typeof q.sections)[number]) =>
  s.items.reduce((sum, item) => sum + line(item), 0);
const sectionTotal = (s: (typeof q.sections)[number]) =>
  sectionOriginal(s) + (s.discount ? line(s.discount) : 0);
const originalTotal = q.sections.reduce(
  (sum, section) => sum + sectionOriginal(section),
  0,
);
const total = q.sections.reduce((sum, s) => sum + sectionTotal(s), 0),
  discount = q.sections.reduce(
    (sum, s) => sum + (s.discount ? Math.abs(line(s.discount)) : 0),
    0,
  );
export default function App() {
  return (
    <Shell>
      <div className="hero" id="overview">
        <span className="eyebrow">
          Project quote · prepared for {q.preparedFor}
        </span>
        <h1>A thoughtful foundation for connected living.</h1>
        <p>
          Clear scope for a considered smart home and a separately priced
          network.
        </p>
        <div className="actions">
          <a
            className="button light"
            href="./quote.pdf"
            download={`${q.quoteId}.pdf`}
          >
            Download quote PDF
          </a>
          <a className="button secondary" href="#scope">
            Review scope
          </a>
        </div>
        <div className="meta">
          <span>
            QUOTE <strong>{q.quoteId}</strong>
          </span>
          <span>PREPARED {q.quoteDate}</span>
          <span>VALID UNTIL {q.validUntil}</span>
        </div>
      </div>
      <section className="section quote-summary" aria-label="Quote summary">
        <h2>Quote summary</h2>
        <div className="grid quote-summary-grid">
          <Card className="quote-summary-total">
            <span className="eyebrow">Total investment · AUD</span>
            {originalTotal > total && (
              <p className="quote-summary-original">
                <span>Before discount</span>
                <s>{cents(originalTotal)}</s>
              </p>
            )}
            {originalTotal > total && (
              <span className="sr-only">After discount:</span>
            )}
            <p className="summary quote-summary-amount">{cents(total)}</p>
          </Card>
          <Card className="quote-summary-breakdown">
            <dl>
              {q.sections.map((section) => (
                <div key={section.id} data-summary-section={section.id}>
                  <dt>{section.title}</dt>
                  <dd>
                    {sectionOriginal(section) > sectionTotal(section) && (
                      <>
                        <span className="sr-only">Before discount:</span>
                        <s className="quote-summary-section-original">
                          {cents(sectionOriginal(section))}
                        </s>
                        <span className="sr-only">After discount:</span>
                      </>
                    )}
                    <span className="quote-summary-section-amount">
                      {cents(sectionTotal(section))}
                    </span>
                  </dd>
                </div>
              ))}
              <div className="discount-summary">
                <dt>{q.discountSummary}</dt>
                <dd>{cents(discount)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </section>
      <div className="overview grid" id="overview-details">
        <Card>
          <span className="eyebrow">Prepared for</span>
          <h3>{q.preparedFor}</h3>
          <p>{q.site}</p>
        </Card>
        <Card>
          <span className="eyebrow">Prepared by</span>
          <h3>{q.preparedBy}</h3>
          <p>Valid until {q.validUntil}</p>
        </Card>
      </div>
      <Section id="scope" title="Scope and investment">
        <p className="lead">{q.scopeIntroduction}</p>
        <div
          className="table-wrap"
          role="region"
          aria-label="Itemised quote"
          tabIndex={0}
        >
          <table>
            <caption className="sr-only">Quote line items and totals</caption>
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Qty</th>
                <th className="num">Unit price</th>
                <th className="num">Line total</th>
              </tr>
            </thead>
            <tbody>
              {q.sections.map((s) => (
                <Fragment key={s.id}>
                  <tr className="group" key={s.id}>
                    <th colSpan={4}>{s.title}</th>
                  </tr>
                  {s.items.map((x, i) => (
                    <Fragment key={x.name}>
                      {s.interimSubtotal?.afterItemCount === i && (
                        <tr className="interim" key={s.id + "-hardware"}>
                          <td colSpan={3}>{s.interimSubtotal.label}</td>
                          <td className="num">
                            {cents(s.interimSubtotal.amountCents)}
                          </td>
                        </tr>
                      )}
                      <tr key={x.name}>
                        <td>{x.name}</td>
                        <td className="num">{x.quantity}</td>
                        <td className="num">{cents(x.unitCents)}</td>
                        <td className="num">{cents(line(x))}</td>
                      </tr>
                    </Fragment>
                  ))}
                  {s.interimSubtotal?.afterItemCount === s.items.length && (
                    <tr className="interim">
                      <td colSpan={3}>{s.interimSubtotal.label}</td>
                      <td className="num">
                        {cents(s.interimSubtotal.amountCents)}
                      </td>
                    </tr>
                  )}
                  {s.grossSubtotal && (
                    <tr className="gross">
                      <td colSpan={3}>{s.grossSubtotal.label}</td>
                      <td className="num">
                        {cents(s.grossSubtotal.amountCents)}
                      </td>
                    </tr>
                  )}
                  {s.discount && (
                    <tr className="discount">
                      <td>{s.discount.label}</td>
                      <td className="num">{s.discount.quantity}</td>
                      <td className="num">{cents(s.discount.unitCents)}</td>
                      <td className="num">{cents(line(s.discount))}</td>
                    </tr>
                  )}
                  <tr className="subtotal">
                    <td colSpan={3}>{s.finalLabel || `${s.title} subtotal`}</td>
                    <td className="num">{cents(sectionTotal(s))}</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={3}>Total</td>
                <td className="num">{cents(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div
          className="mobile-items"
          data-testid="mobile-quote-items"
          aria-label="Itemised quote"
        >
          {q.sections.map((s) => (
            <section
              className="mobile-quote-section"
              key={s.id}
              aria-label={s.title}
            >
              <h3>{s.title}</h3>
              {s.items.map((x, i) => (
                <Fragment key={x.name}>
                  {s.interimSubtotal?.afterItemCount === i && (
                    <p className="mobile-subtotal">
                      <span>{s.interimSubtotal.label}</span>
                      <strong>{cents(s.interimSubtotal.amountCents)}</strong>
                    </p>
                  )}
                  <article className="mobile-item">
                    <h4>{x.name}</h4>
                    <div className="mobile-item-facts">
                      <dl className="mobile-item-meta">
                        <div
                          data-fact="quantity"
                          className="mobile-fact mobile-fact--quantity"
                        >
                          <dt>Quantity</dt>
                          <dd>{x.quantity}</dd>
                        </div>
                        <div
                          data-fact="unit-price"
                          className="mobile-fact mobile-fact--unit"
                        >
                          <dt>Unit price</dt>
                          <dd>{cents(x.unitCents)}</dd>
                        </div>
                      </dl>
                      <dl className="mobile-item-total">
                        <div
                          data-fact="line-total"
                          className="mobile-fact mobile-fact--total"
                        >
                          <dt>Line total</dt>
                          <dd>{cents(line(x))}</dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                </Fragment>
              ))}
              {s.interimSubtotal?.afterItemCount === s.items.length && (
                <p className="mobile-subtotal">
                  <span>{s.interimSubtotal.label}</span>
                  <strong>{cents(s.interimSubtotal.amountCents)}</strong>
                </p>
              )}
              {s.grossSubtotal && (
                <p className="mobile-subtotal">
                  <span>{s.grossSubtotal.label}</span>
                  <strong>{cents(s.grossSubtotal.amountCents)}</strong>
                </p>
              )}
              {s.discount && (
                <article className="mobile-item mobile-item--discount">
                  <h4>{s.discount.label}</h4>
                  <div className="mobile-item-facts">
                    <dl className="mobile-item-meta">
                      <div
                        data-fact="quantity"
                        className="mobile-fact mobile-fact--quantity"
                      >
                        <dt>Quantity</dt>
                        <dd>{s.discount.quantity}</dd>
                      </div>
                      <div
                        data-fact="unit-price"
                        className="mobile-fact mobile-fact--unit"
                      >
                        <dt>Unit price</dt>
                        <dd>{cents(s.discount.unitCents)}</dd>
                      </div>
                    </dl>
                    <dl className="mobile-item-total">
                      <div
                        data-fact="line-total"
                        className="mobile-fact mobile-fact--total"
                      >
                        <dt>Line total</dt>
                        <dd>{cents(line(s.discount))}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              )}
              <p className="mobile-subtotal">
                <span>{s.finalLabel || `${s.title} subtotal`}</span>
                <strong>{cents(sectionTotal(s))}</strong>
              </p>
            </section>
          ))}
          <p className="mobile-grand-total">
            <span>Total</span>
            <strong>{cents(total)}</strong>
          </p>
        </div>
        <p className="currency-note">All amounts are in AUD.</p>
        <p className="saving">
          {q.discountSummary}: {cents(discount)}
        </p>
      </Section>
      <Section id="inclusions" title="Included experience">
        <div className="grid">
          {Object.entries(q.inclusions).map(([heading, items]) => (
            <Card key={heading}>
              <h3>{heading[0].toUpperCase() + heading.slice(1)}</h3>
              <ul className="list inclusion-list">
                {items.map((item) =>
                  typeof item === "string" ? (
                    <li key={item}>{item}</li>
                  ) : (
                    <li className="inclusion-group" key={item.label}>
                      <strong>{item.label}</strong>
                      <ul className="inclusion-sublist">
                        {item.items.map((child) => (
                          <li key={child}>{child}</li>
                        ))}
                      </ul>
                    </li>
                  ),
                )}
              </ul>
            </Card>
          ))}
        </div>
      </Section>
      <Section id="terms" title="Notes and terms">
        <ul className="list terms">
          {q.terms.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <div className="grid">
          <Card>
            <span className="eyebrow">Hyper-care</span>
            <p>{q.hyperCare}</p>
          </Card>
          <Card>
            <span className="eyebrow">Hardware warranty</span>
            <p>{q.warranty}</p>
          </Card>
        </div>
      </Section>
      <div className="actions no-print">
        <a className="button" href="./quote.pdf" download={`${q.quoteId}.pdf`}>
          Download quote PDF
        </a>
        <button className="button secondary" onClick={() => window.print()}>
          Print quote
        </button>
      </div>
    </Shell>
  );
}
