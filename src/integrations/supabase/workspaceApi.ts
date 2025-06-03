
import { supabase } from './client';

export interface WorkspaceCreateData {
  name: string;
  url: string;
  slug: string;
  created_by: string;
}

export interface Workspace {
  id: string;
  name: string;
  url: string;
  slug?: string;
  icon?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a workspace and automatically add the creator as an admin member
 */
export const createWorkspace = async (data: WorkspaceCreateData): Promise<Workspace> => {
  try {
    console.log('Creating workspace with data:', data);
    
    // First, create the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: data.name,
        url: data.url,
        slug: data.slug,
        created_by: data.created_by
      })
      .select()
      .single();
      
    if (workspaceError) {
      console.error('Error creating workspace:', workspaceError);
      throw workspaceError;
    }
    
    console.log('Workspace created successfully:', workspace);
    
    // Now add the creator as an admin member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: data.created_by,
        role: 'admin'
      });
      
    if (memberError) {
      console.error('Error adding workspace member:', memberError);
      // Even if member creation fails, we still return the workspace
      // The user can manually be added later
    } else {
      console.log('Workspace member added successfully');
    }
    
    return workspace;
  } catch (error) {
    console.error('Workspace creation failed:', error);
    throw new Error('Failed to create workspace: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Get workspaces for a user (both created and member of)
 */
export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
  try {
    console.log('getUserWorkspaces called with userId:', userId);
    
    // Query for workspaces where user is a member
    const { data: memberWorkspaces, error: memberError } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces!inner (
          id,
          name,
          url,
          slug,
          icon,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error fetching workspace memberships:', memberError);
      
      // Fallback: try to get workspaces created by user
      console.log('Trying fallback approach - fetching workspaces created by user...');
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('created_by', userId);
        
      if (ownedError) {
        console.error('Fallback query also failed:', ownedError);
        throw ownedError;
      }
      
      console.log('Fallback query succeeded, owned workspaces:', ownedWorkspaces);
      return ownedWorkspaces || [];
    }

    console.log('Raw workspace memberships:', memberWorkspaces);

    // Extract workspace data from the join
    const workspaceData: Workspace[] = memberWorkspaces
      ?.map(member => {
        // Extract the workspace from the join result
        const workspace = (member as any).workspaces;
        
        if (workspace && typeof workspace === 'object') {
          return {
            id: workspace.id,
            name: workspace.name,
            url: workspace.url,
            slug: workspace.slug,
            icon: workspace.icon,
            created_by: workspace.created_by,
            created_at: workspace.created_at,
            updated_at: workspace.updated_at
          } as Workspace;
        }
        return null;
      })
      .filter((workspace): workspace is Workspace => workspace !== null) || [];

    console.log('Processed workspaces:', workspaceData);
    return workspaceData;
  } catch (error) {
    console.error('Error in getUserWorkspaces:', error);
    throw error;
  }
};
