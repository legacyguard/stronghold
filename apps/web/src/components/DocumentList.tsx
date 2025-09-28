import { FileText, MoreHorizontal } from "lucide-react";
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
import { getDocumentsForUser } from "@/app/actions/documents";

interface Document {
  id: string;
  file_name: string;
  created_at: string;
}

export const DocumentList = async () => {
  const documents = await getDocumentsForUser();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-2xl text-center">
        <div className="p-lg bg-background rounded-lg mb-md">
          <FileText className="w-8 h-8 text-text-light mx-auto" />
        </div>
        <p className="text-body text-text-light">Zatiaľ ste nenahrali žiadne dokumenty.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Document Name</TableHead>
            <TableHead>Date Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id} className="hover:bg-background/50">
              <TableCell>
                <div className="p-sm bg-background rounded-lg w-fit">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
              </TableCell>
              <TableCell className="font-medium text-text-dark">
                {document.file_name}
              </TableCell>
              <TableCell className="text-caption text-text-light">
                {formatDate(document.created_at)}
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
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Delete
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

export default DocumentList;