import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { IFormValues } from "../chat/AddFriendModal";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { DialogFooter } from "../ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

interface SearchFormProps {
  register: UseFormRegister<IFormValues>;
  errors: FieldErrors<IFormValues>;
  loading: boolean;
  displayNameValue: string;
  isFound: boolean | null;
  searchedDisplayName: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

const SearchForm = ({
  register,
  errors,
  displayNameValue,
  loading,
  isFound,
  searchedDisplayName,
  onSubmit,
  onCancel,
}: SearchFormProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label
          htmlFor="displayName"
          className="text-sm font-semibold"
        >
          Search by display name
        </Label>

        <Input
          id="displayName"
          placeholder="Text display name in here..."
          className="glass border-border/50 focus:border-primary/50 transition-smooth"
          {...register("displayName", {
            required: "You must fill display name",
          })}
        ></Input>
        {errors.displayName && (
          <p className="error-message">{errors.displayName.message}</p>
        )}

        {isFound === false && (
          <span className="error-message">
            User not found
            <span className="font-semibold"> {searchedDisplayName}</span>
          </span>
        )}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            className="flex-1 glass hover:text-destructive"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </DialogClose>

        <Button
          type="submit"
          disabled={loading || !displayNameValue?.trim()}
          className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
        >
          {loading ? (
            <span>Finding ...</span>
          ) : (
            <>
              <Search className="size-4 mr-2" /> Find
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SearchForm;
