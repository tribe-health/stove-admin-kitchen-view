import { agent, updateAgent } from "@/integrations/atprotocol/client.ts";
import { supabase } from "@/integrations/supabase/client";
import { useUsers } from "@/hooks/use-users";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/store/use-user-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, AtSign, Globe, Phone, Mail, User as UserIcon } from "lucide-react";

export interface UserProps {
  userId: string;
}

export default function UserDetails({ userId }: UserProps) {
  const navigate = useNavigate();
  const { fetchUserById } = useUsers();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [atpProfileData, setAtpProfileData] = useState<any>(null);
  
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const userData = await fetchUserById(userId);
        if (userData) {
          setUser(userData);
          
          // If user has a DID, try to fetch AT Protocol profile data
          if (userData.did) {
            try {
              // Update agent to use the user's PDS if available
              if (userData.pds_url) {
                updateAgent(userData.pds_url);
              }
              
              // Fetch profile data using AT Protocol
              const profileResponse = await agent.getProfile({ actor: userData.did });
              
              if (profileResponse.success) {
                const profile = profileResponse.data;
                setAtpProfileData({
                  displayName: profile.displayName || `${userData.first_name} ${userData.last_name}`,
                  description: profile.description || "AT Protocol user",
                  avatar: profile.avatar || null
                });
              } else {
                // Fallback if profile fetch fails
                setAtpProfileData({
                  displayName: `${userData.first_name} ${userData.last_name}`,
                  description: "AT Protocol user",
                  avatar: null
                });
              }
            } catch (error) {
              console.error("Error fetching AT Protocol profile:", error);
              // Set fallback data on error
              setAtpProfileData({
                displayName: `${userData.first_name} ${userData.last_name}`,
                description: "AT Protocol user",
                avatar: null
              });
            }
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, [userId, fetchUserById]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading user details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <UserIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">User not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate initials for avatar fallback
  const getInitials = () => {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {atpProfileData?.avatar ? (
                <AvatarImage src={atpProfileData.avatar} alt={`${user.first_name} ${user.last_name}`} />
              ) : null}
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.first_name} {user.last_name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <AtSign className="h-3 w-3" />
                {user.handle}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 self-start md:self-center">
            AT Protocol User
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {user.phone_number && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone_number}</span>
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">AT Protocol Information</h3>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Decentralized Identifier (DID)</span>
              <div className="flex items-center gap-2 bg-muted p-2 rounded-md overflow-x-auto">
                <code className="text-xs">{user.did}</code>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto shrink-0">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Personal Data Server (PDS)</span>
              <div className="flex items-center gap-2 bg-muted p-2 rounded-md overflow-x-auto">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <code className="text-xs">{user.pds_url}</code>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto shrink-0">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {user.metadata && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                {JSON.stringify(user.metadata, null, 2)}
              </pre>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(`/users/edit/${user.id}`)}>Edit User</Button>
        <Button onClick={() => window.open(`https://bsky.app/profile/${user.handle}`, '_blank')}>
          View AT Protocol Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
