import type { SampleDocument } from '@/samples/types';

/**
 * Synthetic freelance services contract. The traps are unlimited revisions, payment tied to
 * a vague approval, and copyright that transfers before the freelancer is paid.
 */
export const FREELANCE_CONTRACT: SampleDocument = {
  id: 'freelance-contract',
  title: 'Freelance contract',
  role: 'freelancer',
  summary: 'A design engagement where payment depends on approval and the client can cancel at will.',
  pages: [
    `SERVICES AGREEMENT

Between: Lumen Retail LLP (the Client) and Ms K. Nair, sole proprietor (the Consultant).
Effective date: 3 August 2026.

1. Services. The Consultant shall design and deliver a brand identity system, comprising a primary logo, two secondary marks, a colour and typography system, and a twenty-page brand guideline document.

2. Fees. The total fee for the services is Rs. 1,80,000, exclusive of applicable taxes, payable as follows: thirty percent (30%) on signing, and the balance seventy percent (70%) upon the Client's written approval of the final deliverables.

3. Approval. The Client shall review each deliverable and may request revisions. The Consultant shall carry out such revisions until the Client is reasonably satisfied. No separate charge shall be payable for revisions requested within the scope described in clause 1.

4. Payment terms. Undisputed invoices shall be paid within sixty (60) (sixty) days of receipt. The Client may withhold payment of any amount that is the subject of a bona fide dispute, until such dispute is resolved.`,
    `5. Timeline. The Consultant shall deliver the first draft within twenty-one (21) days of the effective date. The parties acknowledge that the project timeline is dependent on timely feedback from the Client.

6. Intellectual property. All intellectual property rights in the deliverables, including all drafts, rejected concepts and working files, shall vest in the Client upon creation. The Consultant hereby assigns to the Client all such rights, whether or not the corresponding fee has been received.

7. Portfolio use. The Consultant shall not display, publish or otherwise use the deliverables, or any part thereof, in any portfolio, website, social media or promotional material, without the prior written consent of the Client.

8. Termination for convenience. The Client may terminate this agreement at any time, for any reason, by giving seven (7) days written notice to the Consultant. Upon such termination, the Client shall pay the Consultant only for deliverables that have been accepted in writing as at the date of termination.

9. Independent contractor. Nothing in this agreement shall be construed to create a relationship of employment, partnership or agency between the parties. The Consultant shall be responsible for the Consultant's own taxes and statutory contributions.`,
    `10. Confidentiality. Each party shall keep confidential all non-public information received from the other party in connection with this agreement.

11. Limitation of liability. The Consultant's aggregate liability arising out of or in connection with this agreement shall not exceed the total fees actually paid to the Consultant under this agreement. Neither party shall be liable for indirect or consequential loss.

12. Indemnity. The Consultant shall indemnify the Client against any claim that the deliverables infringe the intellectual property rights of any third party.

13. Notices. All notices under this agreement shall be in writing and sent to the addresses stated above, or to such other address as a party may notify in writing.

14. Dispute resolution. Any dispute arising out of this agreement shall be referred to arbitration by a sole arbitrator appointed by the Client, seated at Mumbai, in accordance with the Arbitration and Conciliation Act, 1996.

15. Governing law. This agreement shall be governed by and construed in accordance with the laws of India.`,
  ],
  beliefs: [
    {
      id: 'free-revisions',
      kind: 'belief',
      text: 'I have to do two rounds of revisions, and anything beyond that is charged extra.',
    },
    {
      id: 'free-portfolio',
      kind: 'belief',
      text: 'I can show this work in my portfolio once the project is finished.',
    },
    {
      id: 'free-cancel',
      kind: 'belief',
      text: 'If the client cancels midway, I get paid for all the work I have already done.',
    },
    {
      id: 'free-late-fee',
      kind: 'belief',
      text: 'The client owes me interest if they pay an invoice late.',
    },
    {
      id: 'free-client-promise',
      kind: 'promise',
      text: 'The client said on a call that the final payment would come within two weeks of delivery.',
    },
  ],
};
