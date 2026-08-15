export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          source_operation_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          source_operation_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          source_operation_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_extraction_jobs: {
        Row: {
          attempt_count: number
          created_at: string
          document_upload_id: string
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          model_name: string | null
          processing_strategy: string | null
          provider_name: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          user_subject_id: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          document_upload_id: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          model_name?: string | null
          processing_strategy?: string | null
          provider_name?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_subject_id?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          document_upload_id?: string
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          model_name?: string | null
          processing_strategy?: string | null
          provider_name?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_extraction_jobs_document_owner_fk"
            columns: ["document_upload_id", "user_id"]
            isOneToOne: false
            referencedRelation: "document_uploads"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "ai_extraction_jobs_subject_fk"
            columns: ["user_subject_id"]
            isOneToOne: false
            referencedRelation: "user_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_extraction_results: {
        Row: {
          approved_at: string | null
          component_count: number
          created_at: string
          id: string
          job_id: string
          rejected_at: string | null
          result_json: Json
          review_status: string
          schema_version: string
          topic_count: number
          updated_at: string
          user_id: string
          validation_errors: Json
          validation_status: string
        }
        Insert: {
          approved_at?: string | null
          component_count?: number
          created_at?: string
          id?: string
          job_id: string
          rejected_at?: string | null
          result_json: Json
          review_status?: string
          schema_version: string
          topic_count?: number
          updated_at?: string
          user_id: string
          validation_errors?: Json
          validation_status: string
        }
        Update: {
          approved_at?: string | null
          component_count?: number
          created_at?: string
          id?: string
          job_id?: string
          rejected_at?: string | null
          result_json?: Json
          review_status?: string
          schema_version?: string
          topic_count?: number
          updated_at?: string
          user_id?: string
          validation_errors?: Json
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_extraction_results_job_owner_fk"
            columns: ["job_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_extraction_jobs"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          end_at: string | null
          event_type: string
          id: string
          is_all_day: boolean
          source_entity_id: string | null
          source_entity_type: string | null
          start_at: string
          timezone: string | null
          title: string
          updated_at: string
          user_id: string
          user_subject_id: string | null
          version: number
        }
        Insert: {
          client_operation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_at?: string | null
          event_type: string
          id?: string
          is_all_day?: boolean
          source_entity_id?: string | null
          source_entity_type?: string | null
          start_at: string
          timezone?: string | null
          title: string
          updated_at?: string
          user_id: string
          user_subject_id?: string | null
          version?: number
        }
        Update: {
          client_operation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_at?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          source_entity_id?: string | null
          source_entity_type?: string | null
          start_at?: string
          timezone?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          user_subject_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_subject_fk"
            columns: ["user_subject_id"]
            isOneToOne: false
            referencedRelation: "user_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue_subjects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          qualification_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          qualification_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          qualification_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_subjects_qualification_id_fkey"
            columns: ["qualification_id"]
            isOneToOne: false
            referencedRelation: "qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_deadlines: {
        Row: {
          client_operation_id: string | null
          created_at: string
          custom_syllabus_node_id: string | null
          deleted_at: string | null
          due_at: string
          id: string
          reminder_enabled: boolean
          status: string
          syllabus_node_id: string | null
          title_override: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        Insert: {
          client_operation_id?: string | null
          created_at?: string
          custom_syllabus_node_id?: string | null
          deleted_at?: string | null
          due_at: string
          id?: string
          reminder_enabled?: boolean
          status?: string
          syllabus_node_id?: string | null
          title_override?: string | null
          updated_at?: string
          user_id: string
          user_subject_id: string
          version?: number
        }
        Update: {
          client_operation_id?: string | null
          created_at?: string
          custom_syllabus_node_id?: string | null
          deleted_at?: string | null
          due_at?: string
          id?: string
          reminder_enabled?: boolean
          status?: string
          syllabus_node_id?: string | null
          title_override?: string | null
          updated_at?: string
          user_id?: string
          user_subject_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapter_deadlines_custom_node_owner_fk"
            columns: ["custom_syllabus_node_id", "user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "custom_syllabus_nodes"
            referencedColumns: ["id", "user_subject_id", "user_id"]
          },
          {
            foreignKeyName: "chapter_deadlines_subject_owner_fk"
            columns: ["user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_subjects"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "chapter_deadlines_syllabus_node_id_fkey"
            columns: ["syllabus_node_id"]
            isOneToOne: false
            referencedRelation: "syllabus_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_components: {
        Row: {
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          display_order: number
          duration_minutes: number | null
          id: string
          name: string
          paper_code: string | null
          total_marks: number | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
          weighting_percent: number | null
        }
        Insert: {
          client_operation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          duration_minutes?: number | null
          id?: string
          name: string
          paper_code?: string | null
          total_marks?: number | null
          updated_at?: string
          user_id: string
          user_subject_id: string
          version?: number
          weighting_percent?: number | null
        }
        Update: {
          client_operation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number
          duration_minutes?: number | null
          id?: string
          name?: string
          paper_code?: string | null
          total_marks?: number | null
          updated_at?: string
          user_id?: string
          user_subject_id?: string
          version?: number
          weighting_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_components_subject_owner_fk"
            columns: ["user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_subjects"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      custom_subjects: {
        Row: {
          client_operation_id: string | null
          code: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          qualification_label: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          client_operation_id?: string | null
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          qualification_label?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          client_operation_id?: string | null
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          qualification_label?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      custom_syllabus_nodes: {
        Row: {
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          node_code: string | null
          node_type: string
          parent_id: string | null
          sort_order: number
          source_key: string | null
          source_type: string
          title: string
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        Insert: {
          client_operation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          node_code?: string | null
          node_type: string
          parent_id?: string | null
          sort_order?: number
          source_key?: string | null
          source_type?: string
          title: string
          updated_at?: string
          user_id: string
          user_subject_id: string
          version?: number
        }
        Update: {
          client_operation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          node_code?: string | null
          node_type?: string
          parent_id?: string | null
          sort_order?: number
          source_key?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          user_id?: string
          user_subject_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_syllabus_nodes_parent_owner_fk"
            columns: ["parent_id", "user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "custom_syllabus_nodes"
            referencedColumns: ["id", "user_subject_id", "user_id"]
          },
          {
            foreignKeyName: "custom_syllabus_nodes_subject_owner_fk"
            columns: ["user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_subjects"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      document_uploads: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          mime_type: string
          original_filename: string
          retention_until: string | null
          sha256: string | null
          size_bytes: number
          status: string
          storage_bucket: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          mime_type: string
          original_filename: string
          retention_until?: string | null
          sha256?: string | null
          size_bytes: number
          status?: string
          storage_bucket: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          mime_type?: string
          original_filename?: string
          retention_until?: string | null
          sha256?: string | null
          size_bytes?: number
          status?: string
          storage_bucket?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      exam_boards: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          website_label: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          website_label?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          website_label?: string | null
        }
        Relationships: []
      }
      import_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_summary: Json
          id: string
          preview_summary: Json
          result_summary: Json
          source_hash: string | null
          source_type: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_summary?: Json
          id?: string
          preview_summary?: Json
          result_summary?: Json
          source_hash?: string | null
          source_type: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_summary?: Json
          id?: string
          preview_summary?: Json
          result_summary?: Json
          source_hash?: string | null
          source_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          ai_job_updates: boolean
          created_at: string
          email_enabled: boolean
          migration_updates: boolean
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sync_conflicts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_job_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          migration_updates?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sync_conflicts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_job_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          migration_updates?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sync_conflicts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          dedupe_key: string | null
          expires_at: string | null
          id: string
          payload: Json
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          dedupe_key?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          dedupe_key?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_attempts: {
        Row: {
          attempt_date: string
          client_operation_id: string | null
          component_name_snapshot: string | null
          created_at: string
          custom_component_id: string | null
          deleted_at: string | null
          duration_minutes: number | null
          id: string
          max_marks: number
          notes: string | null
          paper_code_snapshot: string | null
          paper_year: number | null
          percentage: number | null
          score: number
          session: string | null
          syllabus_component_id: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          variant: string | null
          version: number
        }
        Insert: {
          attempt_date?: string
          client_operation_id?: string | null
          component_name_snapshot?: string | null
          created_at?: string
          custom_component_id?: string | null
          deleted_at?: string | null
          duration_minutes?: number | null
          id?: string
          max_marks: number
          notes?: string | null
          paper_code_snapshot?: string | null
          paper_year?: number | null
          percentage?: number | null
          score: number
          session?: string | null
          syllabus_component_id?: string | null
          updated_at?: string
          user_id: string
          user_subject_id: string
          variant?: string | null
          version?: number
        }
        Update: {
          attempt_date?: string
          client_operation_id?: string | null
          component_name_snapshot?: string | null
          created_at?: string
          custom_component_id?: string | null
          deleted_at?: string | null
          duration_minutes?: number | null
          id?: string
          max_marks?: number
          notes?: string | null
          paper_code_snapshot?: string | null
          paper_year?: number | null
          percentage?: number | null
          score?: number
          session?: string | null
          syllabus_component_id?: string | null
          updated_at?: string
          user_id?: string
          user_subject_id?: string
          variant?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "paper_attempts_custom_component_owner_fk"
            columns: ["custom_component_id", "user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "custom_components"
            referencedColumns: ["id", "user_subject_id", "user_id"]
          },
          {
            foreignKeyName: "paper_attempts_subject_owner_fk"
            columns: ["user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_subjects"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "paper_attempts_syllabus_component_id_fkey"
            columns: ["syllabus_component_id"]
            isOneToOne: false
            referencedRelation: "syllabus_components"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          onboarding_completed_at: string | null
          onboarding_status: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      qualifications: {
        Row: {
          code: string
          created_at: string
          exam_board_id: string
          id: string
          is_active: boolean
          level_label: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          exam_board_id: string
          id?: string
          is_active?: boolean
          level_label: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          exam_board_id?: string
          id?: string
          is_active?: boolean
          level_label?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualifications_exam_board_id_fkey"
            columns: ["exam_board_id"]
            isOneToOne: false
            referencedRelation: "exam_boards"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_components: {
        Row: {
          created_at: string
          display_order: number
          duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          paper_code: string | null
          syllabus_version_id: string
          total_marks: number | null
          updated_at: string
          weighting_percent: number | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          paper_code?: string | null
          syllabus_version_id: string
          total_marks?: number | null
          updated_at?: string
          weighting_percent?: number | null
        }
        Update: {
          created_at?: string
          display_order?: number
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          paper_code?: string | null
          syllabus_version_id?: string
          total_marks?: number | null
          updated_at?: string
          weighting_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_components_syllabus_version_id_fkey"
            columns: ["syllabus_version_id"]
            isOneToOne: false
            referencedRelation: "syllabus_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_nodes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          node_code: string | null
          node_type: string
          parent_id: string | null
          sort_order: number
          source_key: string | null
          syllabus_version_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          node_code?: string | null
          node_type: string
          parent_id?: string | null
          sort_order?: number
          source_key?: string | null
          syllabus_version_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          node_code?: string | null
          node_type?: string
          parent_id?: string | null
          sort_order?: number
          source_key?: string | null
          syllabus_version_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_nodes_parent_version_fk"
            columns: ["parent_id", "syllabus_version_id"]
            isOneToOne: false
            referencedRelation: "syllabus_nodes"
            referencedColumns: ["id", "syllabus_version_id"]
          },
          {
            foreignKeyName: "syllabus_nodes_syllabus_version_id_fkey"
            columns: ["syllabus_version_id"]
            isOneToOne: false
            referencedRelation: "syllabus_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_notes: {
        Row: {
          client_operation_id: string | null
          content: string
          created_at: string
          custom_syllabus_node_id: string | null
          deleted_at: string | null
          id: string
          syllabus_node_id: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        Insert: {
          client_operation_id?: string | null
          content?: string
          created_at?: string
          custom_syllabus_node_id?: string | null
          deleted_at?: string | null
          id?: string
          syllabus_node_id?: string | null
          updated_at?: string
          user_id: string
          user_subject_id: string
          version?: number
        }
        Update: {
          client_operation_id?: string | null
          content?: string
          created_at?: string
          custom_syllabus_node_id?: string | null
          deleted_at?: string | null
          id?: string
          syllabus_node_id?: string | null
          updated_at?: string
          user_id?: string
          user_subject_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_notes_custom_node_owner_fk"
            columns: ["custom_syllabus_node_id", "user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "custom_syllabus_nodes"
            referencedColumns: ["id", "user_subject_id", "user_id"]
          },
          {
            foreignKeyName: "syllabus_notes_subject_owner_fk"
            columns: ["user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_subjects"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "syllabus_notes_syllabus_node_id_fkey"
            columns: ["syllabus_node_id"]
            isOneToOne: false
            referencedRelation: "syllabus_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_versions: {
        Row: {
          created_at: string
          id: string
          published_at: string | null
          source_reference: string | null
          source_sha256: string | null
          status: string
          syllabus_id: string
          updated_at: string
          valid_from_year: number
          valid_to_year: number
          version_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          published_at?: string | null
          source_reference?: string | null
          source_sha256?: string | null
          status?: string
          syllabus_id: string
          updated_at?: string
          valid_from_year: number
          valid_to_year: number
          version_label: string
        }
        Update: {
          created_at?: string
          id?: string
          published_at?: string | null
          source_reference?: string | null
          source_sha256?: string | null
          status?: string
          syllabus_id?: string
          updated_at?: string
          valid_from_year?: number
          valid_to_year?: number
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_versions_syllabus_id_fkey"
            columns: ["syllabus_id"]
            isOneToOne: false
            referencedRelation: "syllabuses"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabuses: {
        Row: {
          catalogue_subject_id: string
          created_at: string
          id: string
          is_active: boolean
          syllabus_code: string
          title: string
          updated_at: string
        }
        Insert: {
          catalogue_subject_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          syllabus_code: string
          title: string
          updated_at?: string
        }
        Update: {
          catalogue_subject_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          syllabus_code?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabuses_catalogue_subject_id_fkey"
            columns: ["catalogue_subject_id"]
            isOneToOne: false
            referencedRelation: "catalogue_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          achieved_at: string
          acknowledged_at: string | null
          id: string
          metadata: Json
          milestone_code: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          acknowledged_at?: string | null
          id?: string
          metadata?: Json
          milestone_code: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          acknowledged_at?: string | null
          id?: string
          metadata?: Json
          milestone_code?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          ai_processing_consent_at: string | null
          created_at: string
          locale: string
          sync_appearance_preferences: boolean
          timezone: string
          updated_at: string
          user_id: string
          week_starts_on: number
        }
        Insert: {
          ai_processing_consent_at?: string | null
          created_at?: string
          locale?: string
          sync_appearance_preferences?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          week_starts_on?: number
        }
        Update: {
          ai_processing_consent_at?: string | null
          created_at?: string
          locale?: string
          sync_appearance_preferences?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          week_starts_on?: number
        }
        Relationships: []
      }
      user_subjects: {
        Row: {
          catalogue_subject_id: string | null
          client_operation_id: string | null
          created_at: string
          custom_subject_id: string | null
          deleted_at: string | null
          display_name_override: string | null
          id: string
          is_archived: boolean
          sort_order: number
          syllabus_version_id: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          catalogue_subject_id?: string | null
          client_operation_id?: string | null
          created_at?: string
          custom_subject_id?: string | null
          deleted_at?: string | null
          display_name_override?: string | null
          id?: string
          is_archived?: boolean
          sort_order?: number
          syllabus_version_id?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          catalogue_subject_id?: string | null
          client_operation_id?: string | null
          created_at?: string
          custom_subject_id?: string | null
          deleted_at?: string | null
          display_name_override?: string | null
          id?: string
          is_archived?: boolean
          sort_order?: number
          syllabus_version_id?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_subjects_catalogue_subject_id_fkey"
            columns: ["catalogue_subject_id"]
            isOneToOne: false
            referencedRelation: "catalogue_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subjects_custom_subject_owner_fk"
            columns: ["custom_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "custom_subjects"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "user_subjects_syllabus_version_id_fkey"
            columns: ["syllabus_version_id"]
            isOneToOne: false
            referencedRelation: "syllabus_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_syllabus_progress: {
        Row: {
          client_operation_id: string | null
          confidence_status: string | null
          created_at: string
          custom_syllabus_node_id: string | null
          deleted_at: string | null
          id: string
          last_reviewed_at: string | null
          syllabus_node_id: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        Insert: {
          client_operation_id?: string | null
          confidence_status?: string | null
          created_at?: string
          custom_syllabus_node_id?: string | null
          deleted_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          syllabus_node_id?: string | null
          updated_at?: string
          user_id: string
          user_subject_id: string
          version?: number
        }
        Update: {
          client_operation_id?: string | null
          confidence_status?: string | null
          created_at?: string
          custom_syllabus_node_id?: string | null
          deleted_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          syllabus_node_id?: string | null
          updated_at?: string
          user_id?: string
          user_subject_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_syllabus_progress_custom_node_owner_fk"
            columns: ["custom_syllabus_node_id", "user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "custom_syllabus_nodes"
            referencedColumns: ["id", "user_subject_id", "user_id"]
          },
          {
            foreignKeyName: "user_syllabus_progress_subject_owner_fk"
            columns: ["user_subject_id", "user_id"]
            isOneToOne: false
            referencedRelation: "user_subjects"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "user_syllabus_progress_syllabus_node_id_fkey"
            columns: ["syllabus_node_id"]
            isOneToOne: false
            referencedRelation: "syllabus_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reflections: {
        Row: {
          challenges: string | null
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          next_steps: string | null
          rating: number | null
          updated_at: string
          user_id: string
          version: number
          week_start: string
          wins: string | null
        }
        Insert: {
          challenges?: string | null
          client_operation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          next_steps?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
          version?: number
          week_start: string
          wins?: string | null
        }
        Update: {
          challenges?: string | null
          client_operation_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          next_steps?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
          version?: number
          week_start?: string
          wins?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_milestone: {
        Args: { p_milestone_id: string }
        Returns: {
          achieved_at: string
          acknowledged_at: string | null
          id: string
          metadata: Json
          milestone_code: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_milestones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_ai_job: {
        Args: { p_job_id: string }
        Returns: {
          attempt_count: number
          created_at: string
          document_upload_id: string
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          model_name: string | null
          processing_strategy: string | null
          provider_name: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          user_subject_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "ai_extraction_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      change_username: {
        Args: { p_username: string }
        Returns: {
          created_at: string
          display_name: string | null
          onboarding_completed_at: string | null
          onboarding_status: string
          updated_at: string
          user_id: string
          username: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_user_subject: {
        Args: {
          p_catalogue_subject_id?: string
          p_client_operation_id?: string
          p_custom_subject_id?: string
          p_display_name_override?: string
          p_sort_order?: number
          p_syllabus_version_id?: string
        }
        Returns: {
          catalogue_subject_id: string | null
          client_operation_id: string | null
          created_at: string
          custom_subject_id: string | null
          deleted_at: string | null
          display_name_override: string | null
          id: string
          is_archived: boolean
          sort_order: number
          syllabus_version_id: string | null
          updated_at: string
          user_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "user_subjects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: {
          body: string
          category: string
          created_at: string
          dedupe_key: string | null
          expires_at: string | null
          id: string
          payload: Json
          read_at: string | null
          title: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_push_device: {
        Args: {
          p_browser_label?: string
          p_device_label?: string
          p_platform?: string
          p_token: string
        }
        Returns: string
      }
      review_ai_result: {
        Args: { p_decision: string; p_job_id: string }
        Returns: {
          approved_at: string | null
          component_count: number
          created_at: string
          id: string
          job_id: string
          rejected_at: string | null
          result_json: Json
          review_status: string
          schema_version: string
          topic_count: number
          updated_at: string
          user_id: string
          validation_errors: Json
          validation_status: string
        }
        SetofOptions: {
          from: "*"
          to: "ai_extraction_results"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_push_device: { Args: { p_device_id: string }; Returns: boolean }
      set_syllabus_note: {
        Args: {
          p_base_version?: number
          p_client_operation_id?: string
          p_content: string
          p_custom_syllabus_node_id: string
          p_syllabus_node_id: string
          p_user_subject_id: string
        }
        Returns: {
          client_operation_id: string | null
          content: string
          created_at: string
          custom_syllabus_node_id: string | null
          deleted_at: string | null
          id: string
          syllabus_node_id: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "syllabus_notes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_syllabus_progress: {
        Args: {
          p_base_version?: number
          p_client_operation_id?: string
          p_confidence_status: string
          p_custom_syllabus_node_id: string
          p_syllabus_node_id: string
          p_user_subject_id: string
        }
        Returns: {
          client_operation_id: string | null
          confidence_status: string | null
          created_at: string
          custom_syllabus_node_id: string | null
          deleted_at: string | null
          id: string
          last_reviewed_at: string | null
          syllabus_node_id: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "user_syllabus_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_user_subject_archived: {
        Args: {
          p_archived: boolean
          p_base_version: number
          p_subject_id: string
        }
        Returns: {
          catalogue_subject_id: string | null
          client_operation_id: string | null
          created_at: string
          custom_subject_id: string | null
          deleted_at: string | null
          display_name_override: string | null
          id: string
          is_archived: boolean
          sort_order: number
          syllabus_version_id: string | null
          updated_at: string
          user_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "user_subjects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_calendar_event: {
        Args: { p_base_version: number; p_event_id: string }
        Returns: {
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          end_at: string | null
          event_type: string
          id: string
          is_all_day: boolean
          source_entity_id: string | null
          source_entity_type: string | null
          start_at: string
          timezone: string | null
          title: string
          updated_at: string
          user_id: string
          user_subject_id: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "calendar_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_chapter_deadline: {
        Args: { p_base_version: number; p_deadline_id: string }
        Returns: {
          client_operation_id: string | null
          created_at: string
          custom_syllabus_node_id: string | null
          deleted_at: string | null
          due_at: string
          id: string
          reminder_enabled: boolean
          status: string
          syllabus_node_id: string | null
          title_override: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "chapter_deadlines"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_custom_component: {
        Args: { p_base_version: number; p_component_id: string }
        Returns: {
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          display_order: number
          duration_minutes: number | null
          id: string
          name: string
          paper_code: string | null
          total_marks: number | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
          weighting_percent: number | null
        }
        SetofOptions: {
          from: "*"
          to: "custom_components"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_custom_subject: {
        Args: { p_base_version: number; p_custom_subject_id: string }
        Returns: {
          client_operation_id: string | null
          code: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          qualification_label: string | null
          updated_at: string
          user_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "custom_subjects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_custom_syllabus_node: {
        Args: { p_base_version: number; p_node_id: string }
        Returns: {
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          node_code: string | null
          node_type: string
          parent_id: string | null
          sort_order: number
          source_key: string | null
          source_type: string
          title: string
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "custom_syllabus_nodes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_paper_attempt: {
        Args: { p_attempt_id: string; p_base_version: number }
        Returns: {
          attempt_date: string
          client_operation_id: string | null
          component_name_snapshot: string | null
          created_at: string
          custom_component_id: string | null
          deleted_at: string | null
          duration_minutes: number | null
          id: string
          max_marks: number
          notes: string | null
          paper_code_snapshot: string | null
          paper_year: number | null
          percentage: number | null
          score: number
          session: string | null
          syllabus_component_id: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          variant: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "paper_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_syllabus_note: {
        Args: { p_base_version: number; p_note_id: string }
        Returns: {
          client_operation_id: string | null
          content: string
          created_at: string
          custom_syllabus_node_id: string | null
          deleted_at: string | null
          id: string
          syllabus_node_id: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "syllabus_notes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_syllabus_progress: {
        Args: { p_base_version: number; p_progress_id: string }
        Returns: {
          client_operation_id: string | null
          confidence_status: string | null
          created_at: string
          custom_syllabus_node_id: string | null
          deleted_at: string | null
          id: string
          last_reviewed_at: string | null
          syllabus_node_id: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "user_syllabus_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_user_subject: {
        Args: { p_base_version: number; p_subject_id: string }
        Returns: {
          catalogue_subject_id: string | null
          client_operation_id: string | null
          created_at: string
          custom_subject_id: string | null
          deleted_at: string | null
          display_name_override: string | null
          id: string
          is_archived: boolean
          sort_order: number
          syllabus_version_id: string | null
          updated_at: string
          user_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "user_subjects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_weekly_reflection: {
        Args: { p_base_version: number; p_reflection_id: string }
        Returns: {
          challenges: string | null
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          next_steps: string | null
          rating: number | null
          updated_at: string
          user_id: string
          version: number
          week_start: string
          wins: string | null
        }
        SetofOptions: {
          from: "*"
          to: "weekly_reflections"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_calendar_event_if_version: {
        Args: {
          p_base_version: number
          p_description: string
          p_end_at: string
          p_event_id: string
          p_is_all_day: boolean
          p_start_at: string
          p_timezone: string
          p_title: string
        }
        Returns: {
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          end_at: string | null
          event_type: string
          id: string
          is_all_day: boolean
          source_entity_id: string | null
          source_entity_type: string | null
          start_at: string
          timezone: string | null
          title: string
          updated_at: string
          user_id: string
          user_subject_id: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "calendar_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_chapter_deadline_if_version: {
        Args: {
          p_base_version: number
          p_deadline_id: string
          p_due_at: string
          p_reminder_enabled: boolean
          p_status: string
          p_title_override: string
        }
        Returns: {
          client_operation_id: string | null
          created_at: string
          custom_syllabus_node_id: string | null
          deleted_at: string | null
          due_at: string
          id: string
          reminder_enabled: boolean
          status: string
          syllabus_node_id: string | null
          title_override: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "chapter_deadlines"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_custom_component_if_version: {
        Args: {
          p_base_version: number
          p_component_id: string
          p_display_order: number
          p_duration_minutes: number
          p_name: string
          p_paper_code: string
          p_total_marks: number
          p_weighting_percent: number
        }
        Returns: {
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          display_order: number
          duration_minutes: number | null
          id: string
          name: string
          paper_code: string | null
          total_marks: number | null
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
          weighting_percent: number | null
        }
        SetofOptions: {
          from: "*"
          to: "custom_components"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_custom_subject_if_version: {
        Args: {
          p_base_version: number
          p_code?: string
          p_description?: string
          p_name: string
          p_qualification_label?: string
          p_subject_id: string
        }
        Returns: {
          client_operation_id: string | null
          code: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          qualification_label: string | null
          updated_at: string
          user_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "custom_subjects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_custom_syllabus_node_if_version: {
        Args: {
          p_base_version: number
          p_description: string
          p_node_code: string
          p_node_id: string
          p_node_type: string
          p_parent_id: string
          p_sort_order: number
          p_title: string
        }
        Returns: {
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          node_code: string | null
          node_type: string
          parent_id: string | null
          sort_order: number
          source_key: string | null
          source_type: string
          title: string
          updated_at: string
          user_id: string
          user_subject_id: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "custom_syllabus_nodes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_paper_attempt_if_version: {
        Args: {
          p_attempt_date: string
          p_attempt_id: string
          p_base_version: number
          p_duration_minutes?: number
          p_max_marks: number
          p_notes?: string
          p_score: number
        }
        Returns: {
          attempt_date: string
          client_operation_id: string | null
          component_name_snapshot: string | null
          created_at: string
          custom_component_id: string | null
          deleted_at: string | null
          duration_minutes: number | null
          id: string
          max_marks: number
          notes: string | null
          paper_code_snapshot: string | null
          paper_year: number | null
          percentage: number | null
          score: number
          session: string | null
          syllabus_component_id: string | null
          updated_at: string
          user_id: string
          user_subject_id: string
          variant: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "paper_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_weekly_reflection_if_version: {
        Args: {
          p_base_version: number
          p_challenges: string
          p_next_steps: string
          p_rating: number
          p_reflection_id: string
          p_wins: string
        }
        Returns: {
          challenges: string | null
          client_operation_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          next_steps: string | null
          rating: number | null
          updated_at: string
          user_id: string
          version: number
          week_start: string
          wins: string | null
        }
        SetofOptions: {
          from: "*"
          to: "weekly_reflections"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

