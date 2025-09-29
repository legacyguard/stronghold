import { User, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getGuardiansForUser } from "@/app/actions/guardians";

interface Guardian {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export const GuardiansList = async () => {
  const guardians = await getGuardiansForUser();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (guardians.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-2xl text-center">
        <div className="p-lg bg-background rounded-lg mb-md">
          <User className="w-8 h-8 text-text-light mx-auto" />
        </div>
        <p className="text-body text-text-light">Zatiaľ ste nepridali žiadnych strážcov.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Guardian</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guardians.map((guardian) => (
            <TableRow key={guardian.id} className="hover:bg-background/50">
              <TableCell>
                <div className="p-sm bg-background rounded-lg w-fit">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </TableCell>
              <TableCell className="font-medium text-text-dark">
                {guardian.name}
              </TableCell>
              <TableCell className="text-body text-text-light">
                {guardian.email}
              </TableCell>
              <TableCell className="text-caption text-text-light">
                {formatDate(guardian.created_at)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-text-light hover:text-text-dark">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Remove Guardian
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GuardiansList;