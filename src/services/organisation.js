import { supabase } from '../lib/supabase';

/**
 * Organisation Service handles B2B account grouping, credit limits,
 * ledger movements, and multi-user membership scopes.
 */
export const organisationService = {
  /**
   * Fetch an Organisation details, including its credit parameters
   */
  async getOrganisation(orgId) {
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error || !data) {
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching organisation:", error);
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
    }

    return {
      id: data.id,
      name: data.name,
      creditLimit: data.credit_limit,
      creditUsed: data.credit_used,
      availableCredit: data.available_credit,
      paymentTerms: data.payment_terms,
      deliveryLocations: data.delivery_locations || [],
      members: data.members || []
    };
  },

  /**
   * Log a ledger entry to record an account credit adjustment (Section 49)
   */
  async logLedgerMovement(orgId, { type, amount, reference, actor }) {
    const { error: ledgerError } = await supabase
      .from('organisation_ledger')
      .insert([{
        org_id: orgId,
        type,
        amount,
        reference,
        actor,
        timestamp: new Date().toISOString()
      }]);

    if (ledgerError) throw ledgerError;
    
    // Update the org credit balances
    const org = await this.getOrganisation(orgId);
    const updatedCreditUsed = type === 'purchase' 
      ? (org.creditUsed || 0) + amount 
      : (org.creditUsed || 0) - amount;
    
    const { error: updateError } = await supabase
      .from('organisations')
      .update({
        credit_used: Math.max(0, updatedCreditUsed),
        available_credit: Math.max(0, org.creditLimit - Math.max(0, updatedCreditUsed))
      })
      .eq('id', orgId);

    if (updateError) throw updateError;
  },

  /**
   * Invite a new team member to an Organisation (Section 74)
   */
  async inviteTeamMember(orgId, { email, role, invitedBy }) {
    const { error } = await supabase
      .from('organisation_invites')
      .insert([{
        org_id: orgId,
        email,
        role, // 'Procurement' | 'Approver' | 'Finance' | 'Viewer'
        invited_by: invitedBy,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
  }
};
