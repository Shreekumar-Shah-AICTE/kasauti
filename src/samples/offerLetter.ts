import type { SampleDocument } from '@/samples/types';

/**
 * Synthetic employment offer letter. The traps are asymmetric notice, a training bond that
 * turns into a repayment claim, and a variable bonus that reads as guaranteed pay.
 */
export const OFFER_LETTER: SampleDocument = {
  id: 'offer-letter',
  title: 'Job offer letter',
  role: 'employee',
  summary: 'A first job offer with a training bond, unequal notice periods and a discretionary bonus.',
  pages: [
    `NORTHWIND ANALYTICS PRIVATE LIMITED
Letter of Appointment

Date: 12 May 2026
To: Mr S. Bhatt

We are pleased to appoint you as Associate Data Analyst on the following terms.

1. Commencement and probation. Your employment commences on 1 June 2026. You will be on probation for a period of six (6) months, which the Company may extend at its sole discretion for a further period not exceeding six (6) months. Your employment shall be deemed confirmed only upon issue of a written confirmation letter by the Company.

2. Remuneration. Your fixed annual cost to company shall be Rs. 7,20,000, payable monthly, subject to deduction of tax at source and other statutory deductions.

3. Performance bonus. You may be considered for an annual performance bonus of up to twenty percent (20%) of your fixed annual cost to company. Any such bonus is entirely discretionary, is linked to Company and individual performance, and is payable only if you are in employment and not serving notice on the date of disbursement.`,
    `4. Working hours. Your normal working hours shall be from 10:00 to 19:00, Monday to Friday. You may be required to work beyond these hours, and on weekends or public holidays, as reasonably necessary for the performance of your duties, without additional remuneration.

5. Place of work. Your place of work shall be the Company's Bengaluru office. The Company may transfer you to any of its offices, group companies, clients or project locations in India, at its discretion.

6. Notice of termination. During probation, the Company may terminate your employment by giving seven (7) days notice or salary in lieu thereof, and you may resign by giving thirty (30) days notice. After confirmation, the Company may terminate your employment by giving thirty (30) days notice or salary in lieu thereof, and you may resign by giving ninety (90) days written notice. The Company may, at its discretion, require you to serve the notice period in full, and payment of salary in lieu of notice by you shall not be accepted as a matter of right.

7. Training bond. The Company will provide you structured technical training during your first year, the cost of which is assessed at Rs. 2,00,000. Should you resign or be terminated for cause within eighteen (18) months from your date of joining, you shall be liable to reimburse the Company the said amount on a pro-rata basis, and the Company may recover the same from your full and final settlement.`,
    `8. Leave. You shall be entitled to eighteen (18) days of paid leave per calendar year, accruing monthly, of which a maximum of twelve (12) days may be carried forward to the following year. Unavailed leave shall not be encashed at any time, including on separation.

9. Confidentiality. You shall not, during your employment or at any time thereafter, disclose to any person any confidential information of the Company, its clients or its group companies.

10. Intellectual property. All intellectual property created by you in the course of your employment, whether during working hours or otherwise, and whether using Company resources or otherwise, shall vest solely in the Company.

11. Non-solicitation. For a period of twelve (12) months after the cessation of your employment, you shall not solicit any employee or client of the Company.

12. Entire agreement. This letter supersedes all prior discussions, representations and understandings, whether oral or written, between you and the Company.

Please sign and return the duplicate copy of this letter in token of your acceptance.`,
  ],
  beliefs: [
    {
      id: 'offer-bonus',
      kind: 'belief',
      text: 'The 20 percent bonus is part of my salary, so I will receive it every year.',
    },
    {
      id: 'offer-notice',
      kind: 'belief',
      text: 'If I want to quit after confirmation, one month notice is enough.',
    },
    {
      id: 'offer-ip',
      kind: 'belief',
      text: 'A side project I build on my own laptop on a Sunday belongs to me.',
    },
    {
      id: 'offer-wfh',
      kind: 'belief',
      text: 'I can work from home two days a week.',
    },
    {
      id: 'offer-hr-promise',
      kind: 'promise',
      text: 'The recruiter said the training bond would be waived if I stay for one year.',
    },
  ],
};
