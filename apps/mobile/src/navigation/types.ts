/**
 * Navigation Types
 */

export type RootStackParamList = {
  Home: undefined
  Login: undefined
  Signup: undefined
  Dashboard: undefined
  Settings: undefined
  Workspace: { id: string }
  ContentDetail: { workspaceId: string; contentId: string }
  Chat: { workspaceId: string; contentId?: string }
  Processing: { contentId: string; contentType: 'pdf' | 'youtube' | 'text' }
}

