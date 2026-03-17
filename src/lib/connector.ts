import type { PowerSyncBackendConnector, PowerSyncCredentials } from '@powersync/web'
import { supabase } from './supabase'

export class EmberPowerSyncConnector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials> {
    // Get the current user session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`)
    }
    
    if (!session) {
      throw new Error('No active session found. Please sign in.')
    }

    // Return the Supabase JWT directly as PowerSync credentials
    return {
      endpoint: import.meta.env.VITE_POWERSYNC_URL,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
    }
  }

  async uploadData(database: any): Promise<void> {
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`)
    }
    
    if (!session) {
      throw new Error('No active session found. Please sign in.')
    }

    const transaction = await database.getNextCrudTransaction()
    
    if (!transaction) {
      return // No data to upload
    }

    try {
      // Process each operation in the transaction
      for (const op of transaction.crud) {
        const { table, op: operation, opData, id } = op

        console.log(`Processing ${operation} operation on table ${table}:`, { opData, id })

        switch (operation) {
          case 'PUT':
            // For PUT operations, opData contains the full record including id
            await this.upsertRecord(table, opData)
            break
          case 'PATCH':
            // For PATCH operations, use opData as the update data
            await this.updateRecord(table, { id, ...opData })
            break
          case 'DELETE':
            // For DELETE operations, use the id field
            await this.deleteRecord(table, id)
            break
          default:
            console.warn(`Unknown operation: ${operation}`)
        }
      }

      // Mark transaction as complete after all operations succeed
      await transaction.complete()
      console.log('Upload transaction completed successfully')
    } catch (error) {
      // Handle upload error
      console.error('Upload failed:', error)
      throw error
    }
  }

  private async upsertRecord(table: string, data: Record<string, any>): Promise<void> {
    // Get current user session for user_id
    const { data: { session } } = await supabase.auth.getSession()
    
    // Prepare the record with proper data types and user_id
    const record = {
      ...data,
      user_id: session?.user?.id // Ensure user_id is set
    }

    // Clean up any undefined values and convert JSON arrays to proper arrays
    const cleanRecord = Object.fromEntries(
      Object.entries(record)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, this.convertJsonArraysToArrays(value)])
    )

    console.log(`Upserting to ${table}:`, cleanRecord)

    const { error } = await supabase
      .from(table)
      .upsert(cleanRecord, { onConflict: 'id' })

    if (error) {
      throw new Error(`Failed to upsert ${table}: ${error.message}`)
    }
  }

  private convertJsonArraysToArrays(value: any): any {
    // If it's a string that looks like a JSON array, try to parse it
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value)
        // Only return the parsed value if it's actually an array
        if (Array.isArray(parsed)) {
          return parsed
        }
      } catch (error) {
        console.warn('Failed to parse potential JSON array:', value)
        // If parsing fails, return the original string
      }
    }
    
    return value
  }

  private async updateRecord(table: string, data: Record<string, any>): Promise<void> {
    const { id, ...updateData } = data
    
    if (!id) {
      throw new Error(`Cannot update ${table}: missing id`)
    }

    // Clean up any undefined values and convert JSON arrays to proper arrays
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, this.convertJsonArraysToArrays(value)])
    )

    console.log(`Updating ${table} record ${id}:`, cleanUpdateData)

    const { error } = await supabase
      .from(table)
      .update(cleanUpdateData)
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update ${table}: ${error.message}`)
    }
  }

  private async deleteRecord(table: string, id: string): Promise<void> {
    if (!id) {
      throw new Error(`Cannot delete from ${table}: missing id`)
    }

    console.log(`Deleting ${table} record ${id}`)

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete from ${table}: ${error.message}`)
    }
  }
}

export const powerSyncConnector = new EmberPowerSyncConnector()
export default powerSyncConnector