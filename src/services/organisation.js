import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';

/**
 * Organisation Service handles B2B account grouping, credit limits,
 * ledger movements, and multi-user membership scopes.
 */
export const organisationService = {
  /**
   * Fetch an Organisation details, including its credit parameters
   */
  async getOrganisation(orgId) {
    const docRef = doc(db, 'organisations', orgId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    // Fallback Mock Organization matching Section 6, 41, 54
    return {
      id: orgId,
      name: "Golden View Hotel",
      creditLimit: 50000,
      creditUsed: 30000,
      availableCredit: 20000,
      paymentTerms: "14 Days",
      deliveryLocations: [
        { name: "Main Hotel", address: "Plot 12, Ring Road East, Accra", contactPerson: "John Doe" },
        { name: "Central Warehouse", address: "Tema Industrial Area, Depot B", contactPerson: "Kwame Mensah" },
        { name: "Laundry Department", address: "Plot 12, Ring Road East, Basement", contactPerson: "Sarah Osei" }
      ],
      members: [
        { uid: "proc_1", name: "Kofi Boateng", role: "Procurement" },
        { uid: "fin_1", name: "Ama Serwaa", role: "Finance" },
        { uid: "mgr_1", name: "John Doe", role: "Approver" }
      ]
    };
  },

  /**
   * Log a ledger entry to record an account credit adjustment (Section 49)
   */
  async logLedgerMovement(orgId, { type, amount, reference, actor }) {
    const ledgerRef = collection(db, `organisations/${orgId}/ledger`);
    const newEntry = {
      type, // 'deposit' | 'purchase' | 'refund' | 'adjustment'
      amount,
      reference, // e.g. "Order 123"
      actor,
      timestamp: new Date().toISOString()
    };
    await addDoc(ledgerRef, newEntry);
    
    // Update the org credit balances
    const org = await this.getOrganisation(orgId);
    const updatedCreditUsed = type === 'purchase' 
      ? (org.creditUsed || 0) + amount 
      : (org.creditUsed || 0) - amount;
    
    const orgRef = doc(db, 'organisations', orgId);
    await updateDoc(orgRef, {
      creditUsed: Math.max(0, updatedCreditUsed),
      availableCredit: Math.max(0, org.creditLimit - Math.max(0, updatedCreditUsed))
    });
  },

  /**
   * Invite a new team member to an Organisation (Section 74)
   */
  async inviteTeamMember(orgId, { email, role, invitedBy }) {
    const invitesRef = collection(db, 'organisation_invites');
    await addDoc(invitesRef, {
      orgId,
      email,
      role, // 'Procurement' | 'Approver' | 'Finance' | 'Viewer'
      invitedBy,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  }
};
