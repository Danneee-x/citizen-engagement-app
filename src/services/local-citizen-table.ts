import { CitizenUser } from '@/src/types/citizen';

/**
 * CITIZEN LOCAL MAPPING TABLE
 * 
 * Represents the client-side local schema & table store matching the
 * Citizen Account ERD (Citizen_Users table).
 * 
 * Used for local persistence, offline simulation, and cross-screen data fetching.
 */

export interface CitizenUserRecord extends CitizenUser {
  // Verification details attached to citizen profile
  birth_date?: string;
  civil_status?: string;
  place_of_birth?: string;
  district?: string;
  barangay?: string;
  street_address?: string;
  years_resident?: string;
  employment_status?: string;
  occupation?: string;
  educational_attainment?: string;
  valid_id_type?: string;
  valid_id_number?: string;
}

// In-memory local mapping table records
let localCitizenUsersTable: CitizenUserRecord[] = [
  {
    citizen_user_id: 1001,
    first_name: 'Danny',
    middle_name: 'Toledano',
    has_no_middle_name: 0,
    last_name: 'Espelita',
    suffix: 'Jr',
    email: 'danny.espelita@civentral.ph',
    mobile_number: '09171234567',
    status: 'Active',
    registry_completed: 0,
    failed_attempts: 0,
    last_login: new Date().toISOString(),
    biometric_enabled: 1,
    birth_date: '1998-05-15',
    place_of_birth: 'Caloocan City',
    civil_status: 'Single',
    district: 'District 1',
    barangay: 'Barangay 171 (Bagumbong)',
    street_address: 'Block 12 Lot 5, Sampaguita St.',
    years_resident: '12',
    employment_status: 'Employed (Private Sector)',
    occupation: 'Corporate / Office Employee',
    educational_attainment: 'College / Bachelor’s Degree Graduate',
    created_at: '2026-01-10T08:30:00Z',
    updated_at: new Date().toISOString(),
  },
];

// Active session holder
let activeSessionUser: CitizenUserRecord | null = localCitizenUsersTable[0];

export class LocalCitizenTable {
  /**
   * Insert a new record into the Citizen_Users local mapping table
   */
  static insert(record: Omit<CitizenUserRecord, 'citizen_user_id'> & { citizen_user_id?: number }): CitizenUserRecord {
    const existing = this.findByEmail(record.email) || (record.mobile_number ? this.findByPhone(record.mobile_number) : null);
    if (existing) {
      // Update existing record
      return this.update(existing.citizen_user_id, record) as CitizenUserRecord;
    }

    const nextId = record.citizen_user_id || (localCitizenUsersTable.length > 0
      ? Math.max(...localCitizenUsersTable.map((u) => u.citizen_user_id)) + 1
      : 1001);

    const now = new Date().toISOString();
    const newUser: CitizenUserRecord = {
      ...record,
      citizen_user_id: nextId,
      status: record.status || 'Active',
      registry_completed: record.registry_completed || 0,
      has_no_middle_name: record.has_no_middle_name || 0,
      biometric_enabled: record.biometric_enabled || 0,
      failed_attempts: 0,
      created_at: record.created_at || now,
      updated_at: now,
    };

    localCitizenUsersTable.push(newUser);
    activeSessionUser = newUser;
    return newUser;
  }

  /**
   * Find a user record by primary key: citizen_user_id
   */
  static findById(citizenUserId: number): CitizenUserRecord | null {
    return localCitizenUsersTable.find((u) => u.citizen_user_id === citizenUserId) || null;
  }

  /**
   * Find a user record by unique column: email
   */
  static findByEmail(email: string): CitizenUserRecord | null {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return localCitizenUsersTable.find((u) => u.email.trim().toLowerCase() === cleanEmail) || null;
  }

  /**
   * Find a user record by unique column: mobile_number
   */
  static findByPhone(mobileNumber: string): CitizenUserRecord | null {
    if (!mobileNumber) return null;
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    return localCitizenUsersTable.find((u) => u.mobile_number && u.mobile_number.replace(/\D/g, '') === cleanPhone) || null;
  }

  /**
   * Update columns for an existing user record
   */
  static update(citizenUserId: number, updates: Partial<CitizenUserRecord>): CitizenUserRecord | null {
    const index = localCitizenUsersTable.findIndex((u) => u.citizen_user_id === citizenUserId);
    if (index === -1) return null;

    const updated = {
      ...localCitizenUsersTable[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    localCitizenUsersTable[index] = updated;
    if (activeSessionUser && activeSessionUser.citizen_user_id === citizenUserId) {
      activeSessionUser = updated;
    }

    return updated;
  }

  /**
   * Retrieve all records currently in the local mapping table
   */
  static getAll(): CitizenUserRecord[] {
    return [...localCitizenUsersTable];
  }

  /**
   * Get the active session citizen
   */
  static getActiveSession(): CitizenUserRecord | null {
    return activeSessionUser;
  }

  /**
   * Set active session citizen
   */
  static setActiveSession(user: CitizenUserRecord | null): void {
    activeSessionUser = user;
  }

  /**
   * Clear active session (on logout)
   */
  static clearSession(): void {
    activeSessionUser = null;
  }
}
