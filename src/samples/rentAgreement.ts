import type { SampleDocument } from '@/samples/types';

/**
 * Synthetic residential rent agreement. The traps are the ones tenants meet most often:
 * a deposit that is not fully refundable, a lock-in that survives early exit, and repair
 * costs that quietly shift to the tenant.
 */
export const RENT_AGREEMENT: SampleDocument = {
  id: 'rent-agreement',
  title: 'Rent agreement',
  role: 'tenant',
  summary: 'An 11-month tenancy with a lock-in period and a deposit that is not returned in full.',
  pages: [
    `LEAVE AND LICENCE AGREEMENT

This agreement is made on 1 April 2026 between Mr A. Deshmukh (the Licensor) and Ms R. Iyer (the Licensee), for the premises at Flat 402, Sunview Apartments, Pune.

1. Term. The licence is granted for a period of eleven (11) months commencing 1 April 2026 and ending 28 February 2027.

2. Licence fee. The Licensee shall pay a monthly licence fee of Rs. 24,000 on or before the 5th day of each calendar month.

3. Escalation. On renewal of this agreement, the monthly licence fee shall stand increased by ten percent (10%) over the then prevailing fee.

4. Security deposit. The Licensee has paid an interest-free refundable security deposit of Rs. 100,000 to the Licensor.

5. Lock-in period. Notwithstanding anything contained in clause 1, the parties agree to a lock-in period of six (6) months. Should the Licensee vacate the premises before the expiry of the lock-in period, the licence fee for the unexpired portion of the lock-in period shall become immediately payable and may be adjusted against the security deposit.`,
    `6. Notice. After the lock-in period, either party may terminate this agreement by giving two (2) months prior written notice to the other party.

7. Refund of deposit. The security deposit, after deduction of the amounts specified in clause 8, shall be refunded to the Licensee within forty-five (45) days from the date of handing over vacant possession of the premises.

8. Deductions. The Licensor shall be entitled to deduct from the security deposit: (a) an amount equal to one month's licence fee towards painting and deep cleaning of the premises, which the parties agree is payable on every vacating irrespective of the condition of the premises; (b) any unpaid licence fee or utility charges; and (c) the cost of making good any damage to the premises or the fixtures therein, normal wear and tear excepted.

9. Maintenance and repairs. All minor repairs to the premises, including repairs to plumbing, electrical fittings, geysers and sanitary ware, up to a value of Rs. 3,000 per instance, shall be carried out by the Licensee at the Licensee's own cost. Major structural repairs shall be the responsibility of the Licensor.

10. Utilities. The Licensee shall pay for electricity, water, gas, internet and any other utility consumed at the premises, as per the bills raised by the respective authorities.`,
    `11. Society charges. Monthly society maintenance charges shall be borne by the Licensor.

12. Use of premises. The premises shall be used solely for residential purposes by the Licensee and the Licensee's immediate family. The Licensee shall not sublet, assign or part with possession of the premises or any part thereof.

13. Inspection. The Licensor or the Licensor's authorised representative may inspect the premises once every month, after giving the Licensee at least twenty-four (24) hours prior notice.

14. Alterations. The Licensee shall not make any permanent alteration or addition to the premises without the prior written consent of the Licensor.

15. Governing law and jurisdiction. This agreement shall be governed by the laws of India and the courts at Pune shall have exclusive jurisdiction.

IN WITNESS WHEREOF the parties have set their hands on the date first above written.`,
  ],
  beliefs: [
    {
      id: 'rent-deposit',
      kind: 'belief',
      text: 'I will get my full security deposit back when I move out, as long as I have not damaged anything.',
    },
    {
      id: 'rent-notice',
      kind: 'belief',
      text: 'I can leave any time by giving two months notice.',
    },
    {
      id: 'rent-repairs',
      kind: 'belief',
      text: 'The owner pays for repairs to the plumbing and the geyser.',
    },
    {
      id: 'rent-parking',
      kind: 'belief',
      text: 'A parking space for one car is included with the flat.',
    },
    {
      id: 'rent-broker-promise',
      kind: 'promise',
      text: 'The broker told me the rent will stay the same if I renew for a second year.',
    },
  ],
};
