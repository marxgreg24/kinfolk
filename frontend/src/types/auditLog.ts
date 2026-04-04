export interface AuditLog {
  id: string
  actor_id?: string
  action: string
  target_type?: string
  target_id?: string
  metadata?: Record<string, unknown>
  created_at: string
}
