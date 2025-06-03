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
 * Create a workspace directly using a custom approach to avoid policy issues
 */
export const createWorkspace = async (data: WorkspaceCreateData): Promise<Workspace> => {
  try {
    console.log('Creating workspace with data:', data);
    
    // Try direct insert first since the RPC function might not be set up yet
    console.log('Attempting direct insert...');
    
    const { data: workspace, error: insertError } = await supabase
      .from('workspaces')
      .insert({
        name: data.name,
        url: data.url,
        slug: data.slug,
        created_by: data.created_by
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error in direct insert:', insertError);
      
      // If direct insert fails, try RPC function
      console.log('Direct insert failed, trying RPC function...');
      
      const { data: rpcWorkspace, error } = await supabase.rpc('create_workspace_direct', {
        workspace_name: data.name,
        workspace_url: data.url,
        workspace_slug: data.slug,
        user_id: data.created_by
      });
      
      if (error) {
        console.error('Error creating workspace via RPC:', error);
        throw error;
      }
      
      console.log('RPC function succeeded:', rpcWorkspace);
      return rpcWorkspace;
    }
    
    console.log('Direct insert succeeded:', workspace);
    return workspace;
  } catch (error) {
    console.error('All workspace creation methods failed:', error);
    throw new Error('Failed to create workspace: ' + (error.message || 'Unknown error'));
  }
};

/**
 * Get workspaces for a user
 */
export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
  try {
    console.log('getUserWorkspaces called with userId:', userId);
    
    // First try with direct query
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('created_by', userId);
      
    if (error) {
      console.error('Error fetching user workspaces:', error);
      throw error;
    }
    
    console.log('Workspaces fetched successfully:', data);
    
    if (!data || data.length === 0) {
      console.log('No workspaces found for user, trying alternative query...');
      
      // Try an alternative query without filters to see if any workspaces exist
      const { data: allWorkspaces, error: allError } = await supabase
        .from('workspaces')
        .select('*');
        
      if (allError) {
        console.error('Error fetching all workspaces:', allError);
      } else {
        console.log('All workspaces in the database:', allWorkspaces);
        console.log('Looking for workspaces with created_by matching:', userId);
        
        // Manually filter to see if there's a type mismatch issue
        const userWorkspaces = allWorkspaces.filter(ws => {
          console.log(`Comparing workspace.created_by: ${ws.created_by} (${typeof ws.created_by}) with userId: ${userId} (${typeof userId})`);
          return ws.created_by === userId;
        });
        
        if (userWorkspaces.length > 0) {
          console.log('Found workspaces after manual filtering:', userWorkspaces);
          return userWorkspaces;
        }
      }
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserWorkspaces:', error);
    throw error;
  }
};
