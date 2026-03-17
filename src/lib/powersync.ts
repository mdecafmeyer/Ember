import { PowerSyncDatabase } from '@powersync/web'
import { Schema, Table, Column, ColumnType } from '@powersync/web'

// Define the schema for the grief memory companion app - matches Supabase exactly
export const schema = new Schema([
  new Table({
    name: 'moments',
    columns: [
      new Column({ name: 'id', type: ColumnType.TEXT }),
      new Column({ name: 'user_id', type: ColumnType.TEXT }),
      new Column({ name: 'text', type: ColumnType.TEXT }),
      new Column({ name: 'moment_type', type: ColumnType.TEXT }),
      new Column({ name: 'location_tag', type: ColumnType.TEXT }),
      new Column({ name: 'created_at', type: ColumnType.TEXT }),
      new Column({ name: 'updated_at', type: ColumnType.TEXT })
    ]
  }),
  
  new Table({
    name: 'reflections',
    columns: [
      new Column({ name: 'id', type: ColumnType.TEXT }),
      new Column({ name: 'user_id', type: ColumnType.TEXT }),
      new Column({ name: 'content', type: ColumnType.TEXT }),
      new Column({ name: 'moment_ids', type: ColumnType.TEXT }),
      new Column({ name: 'created_at', type: ColumnType.TEXT }),
      new Column({ name: 'updated_at', type: ColumnType.TEXT })
    ]
  }),
  
  new Table({
    name: 'connections',
    columns: [
      new Column({ name: 'id', type: ColumnType.TEXT }),
      new Column({ name: 'user_id', type: ColumnType.TEXT }),
      new Column({ name: 'moment_a_id', type: ColumnType.TEXT }),
      new Column({ name: 'moment_b_id', type: ColumnType.TEXT }),
      new Column({ name: 'theme', type: ColumnType.TEXT }),
      new Column({ name: 'confirmed', type: ColumnType.TEXT }),
      new Column({ name: 'created_at', type: ColumnType.TEXT })
    ]
  })
])

// Create the PowerSync database instance
export const db = new PowerSyncDatabase({
  database: {
    dbFilename: 'ember.db'
  },
  schema
})

export default db