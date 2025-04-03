import { useParams } from "react-router-dom";
import UserDetails from "@/components/users/user-details";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  if (!userId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
        </div>
        <div className="rounded-md border p-8 text-center">
          <h3 className="text-lg font-medium mb-2">User Not Found</h3>
          <p className="text-muted-foreground">
            No user ID was provided. Please select a user from the users list.
          </p>
          <Button className="mt-4" onClick={() => navigate("/users")}>
            Go to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
      </div>
      <UserDetails userId={userId} />
    </div>
  );
}