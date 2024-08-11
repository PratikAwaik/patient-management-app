import Layout from "@/components/layout";
import Spinner from "@/components/svg/spinner";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeletePatient,
  useGetAllPatients,
} from "@/services/patients/patients.data";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {HumanName, Patient} from "fhir/r4";
import {Pencil, Plus, Trash} from "lucide-react";
import {useCallback, useEffect, useMemo, useState} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {useDebounceCallback} from "usehooks-ts";

const searchByOptions = [
  {label: "Name", value: "name"},
  {label: "Phone", value: "phone"},
];

export default function HomePage() {
  const [searchBy, setSearchBy] = useState<"name" | "phone">("name");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const {data, isLoading} = useGetAllPatients({
    name: searchBy === "name" && searchInput ? searchInput : undefined,
    telecom:
      searchBy === "phone" && searchInput ? `phone|${searchInput}` : undefined,
    _skip: page * 10,
    _count: 10,
  });

  const {mutateAsync: deletePatient, isPending: isDeletingPatient} =
    useDeletePatient();

  const totalPages = useMemo(() => {
    const totalPages = Math.ceil((data?.total || 0) / 10);
    // for some reason server does not support pages above 1000
    if (totalPages > 1000) return 999;
    else return totalPages;
  }, [data?.total]);

  const onSearchInputChange = useDebounceCallback((value: string) => {
    setSearchInput(value);
    setSearchParams((prev) => {
      if (value === "") prev.delete("search");
      else prev.set("search", value);
      return prev;
    });
  }, 300);

  const onPageClick = useCallback(
    (page: number) => {
      setPage(page);
      setSearchParams((prev) => {
        prev.set("page", page.toString());
        return prev;
      });
    },
    [setSearchParams]
  );

  const onSetSearchBy = useCallback(
    (value: "name" | "phone") => {
      setSearchBy(value);
      setSearchParams((prev) => {
        prev.set("searchBy", value);
        return prev;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    const page = searchParams.get("page");
    const search = searchParams.get("search");
    const searchBy = searchParams.get("searchBy");

    if (page) setPage(Number(page));
    else onPageClick(0);
    if (searchBy) setSearchBy(searchBy as "name" | "phone");
    else onSetSearchBy("name");
    if (search) setSearchInput(search);
  }, [searchParams, onPageClick, onSetSearchBy]);

  const columns: ColumnDef<Patient>[] = useMemo(
    () => [
      {
        id: "index",
        cell: ({row}) => row.index + 1,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({getValue}) => {
          const name = getValue() as HumanName[] | undefined;

          const formatName = () => {
            const givenName = name?.[0]?.given?.[0];
            const familyName = name?.[0]?.family;
            const text = name?.[0].text;

            if (givenName && !familyName) return givenName;
            if (!givenName && familyName) return familyName;
            if (givenName && familyName) return `${givenName} ${familyName}`;
            if (text) return text;
            return "-";
          };

          if (name) {
            return formatName();
          }
          return "-";
        },
      },
      {
        accessorKey: "gender",
        header: "Gender",
        cell: ({getValue}) => {
          const gender = getValue();
          if (gender) return gender;
          return "-";
        },
      },
      {
        accessorKey: "birthDate",
        header: "Date of birth",
        cell: ({getValue}) => {
          const dateOfBirth = getValue();
          if (dateOfBirth) return dateOfBirth;
          return "-";
        },
      },
      {
        id: "phone",
        header: "Phone",
        accessorFn: (row) =>
          row.telecom?.find((item) => item.system === "phone")?.value,
        cell: ({getValue}) => getValue() || "-",
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({getValue}) => {
          const active = getValue();
          if (active)
            return (
              <Badge className="bg-green-200 text-green-600 hover:bg-bg-green-200">
                Active
              </Badge>
            );
          return (
            <Badge className="bg-gray-200 text-gray-600 hover:bg-gray-200">
              Inactive
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({row}) => {
          return (
            <div className="flex items-center gap-x-2">
              <Link to={`/create?patientId=${row.original.id}`} className="p-1">
                <Pencil className="w-4 h-4 text-blue-500" />
              </Link>
              <Dialog>
                <DialogTrigger>
                  <div className="p-1 flex items-center justify-center">
                    <Trash className="w-4 h-4 text-red-500 cursor-pointer" />
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>Are you absolutely sure?</DialogHeader>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    the patient and remove their data from our servers.
                  </DialogDescription>
                  <DialogFooter className="justify-end gap-x-2">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      disabled={isDeletingPatient}
                      loading={isDeletingPatient}
                      onClick={() => {
                        if (row.original.id) deletePatient(row.original.id);
                      }}
                    >
                      Yes, delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          );
        },
      },
    ],
    [deletePatient, isDeletingPatient]
  );

  const table = useReactTable({
    data: useMemo(
      () =>
        (data?.entry?.map((ent) => ent.resource).filter((ent) => !!ent) ||
          []) as Patient[],
      [data?.entry]
    ),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const renderPaginationItems = useCallback(() => {
    const items = [];

    if (totalPages <= 7) {
      // Display all pages if total pages are less than or equal to 7
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={i - 1 === page}
              onClick={() => onPageClick(i - 1)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Display first 3 pages, last 3 pages, and surrounding current page with ellipses
      items.push(
        <PaginationItem key={1}>
          <PaginationLink isActive={0 === page} onClick={() => onPageClick(0)}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (page > 4) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }

      for (
        let i = Math.max((page ?? 1) - 2, 2);
        i <= Math.min((page ?? 1) + 2, totalPages - 1);
        i++
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={i - 1 === page}
              onClick={() => onPageClick(i - 1)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if ((page ?? 0) < totalPages - 3) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={totalPages === page}
            onClick={() => onPageClick(totalPages - 1)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  }, [page, totalPages, onPageClick]);

  return (
    <Layout>
      <div className="flex flex-col gap-y-10">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-4xl font-bold">Patients</h1>
          <Link to="/create">
            <Button className="gap-x-2" size="sm">
              <Plus className="w-4 h-4" /> Create patient
            </Button>
          </Link>
        </div>
        <div className="w-full flex items-center gap-x-2">
          <p className="whitespace-nowrap">Search by:</p>
          <Select
            value={searchBy}
            onValueChange={(value: "name" | "phone") => onSetSearchBy(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {searchByOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search"
            className="grow"
            defaultValue={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
          />
        </div>
        <div className="w-full h-full max-h-[80vh] overflow-auto border pb-2">
          <Table className="w-full h-full overflow-hidden">
            <TableHeader className="w-full">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="w-full flex items-center justify-center my-10">
                      <Spinner />
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} id={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-16 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Pagination className="w-full py-2 border-t">
            <PaginationContent className="w-full justify-between">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => setPage((prev) => prev - 1)}
                />
              </PaginationItem>
              <div className="flex items-center gap-x-1">
                {renderPaginationItems()}
              </div>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => setPage((prev) => prev + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </Layout>
  );
}
