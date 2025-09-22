import React, { createContext, useContext, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface TeamMutationsContextType {
  inviteTeamMember: (email: string, role: string) => Promise<void>;
  updateMemberRole: (userId: number, role: string) => Promise<void>;
  removeMember: (userId: number) => Promise<void>;
}

interface TeamMutationsProviderProps {
  children: React.ReactNode;
}

const TeamMutationsContext = createContext<TeamMutationsContextType | undefined>(undefined);

export const useTeamMutations = () => {
  const context = useContext(TeamMutationsContext);
  if (context === undefined) {
    throw new Error('useTeamMutations must be used within a TeamMutationsProvider');
  }
  return context;
};

export const TeamMutationsProvider: React.FC<TeamMutationsProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  const inviteTeamMemberMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const response = await fetch('http://localhost:4000/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), role })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invitation');
      }
      
      return data;
    },
    onSuccess: () => {
      // Team members might not change immediately (invitation-based), 
      // but we could invalidate if there's a pending invitations list
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await fetch(`http://localhost:4000/api/team/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to update role');
      }
      
      return data;
    },
    onSuccess: () => {
      // Refresh team members list to show updated role
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`http://localhost:4000/api/team/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove team member');
      }
      
      return data;
    },
    onSuccess: () => {
      // Refresh team members list to remove the deleted member
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });

  const inviteTeamMember = useCallback(async (email: string, role: string) => {
    await inviteTeamMemberMutation.mutateAsync({ email, role });
  }, [inviteTeamMemberMutation]);

  const updateMemberRole = useCallback(async (userId: number, role: string) => {
    await updateMemberRoleMutation.mutateAsync({ userId, role });
  }, [updateMemberRoleMutation]);

  const removeMember = useCallback(async (userId: number) => {
    await removeMemberMutation.mutateAsync(userId);
  }, [removeMemberMutation]);

  const value: TeamMutationsContextType = {
    inviteTeamMember,
    updateMemberRole,
    removeMember,
  };

  return (
    <TeamMutationsContext.Provider value={value}>
      {children}
    </TeamMutationsContext.Provider>
  );
};