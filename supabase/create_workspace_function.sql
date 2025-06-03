-- Create a function to directly insert workspaces without triggering problematic policies
CREATE OR REPLACE FUNCTION create_workspace_direct(
  workspace_name TEXT,
  workspace_url TEXT,
  workspace_slug TEXT,
  user_id UUID
) RETURNS SETOF workspaces AS $$
BEGIN
  -- Insert the workspace directly
  RETURN QUERY
  INSERT INTO workspaces (name, url, slug, created_by)
  VALUES (workspace_name, workspace_url, workspace_slug, user_id)
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
