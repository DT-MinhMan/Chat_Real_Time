import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UserPlus } from "lucide-react";
import type { User } from "@/types/user";
import { useFriendStore } from "@/store/useFriendStore";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import SearchForm from "@/components/addFriendModal/SearchForm";
import SendFriendRequestForm from "@/components/addFriendModal/SendFriendRequestForm";
import { Button } from "../ui/button";

export interface IFormValues {
  displayName: string;
  message: string;
}

const AddFriendModal = () => {
  const [isFound, setIsFound] = useState<boolean | null>(null);
  const [searchUser, setSearchUser] = useState<User>();
  const [searchedDisplayName, setSearchedDisplayName] = useState("");
  const { loading, searchByDisplayName, addFriend } = useFriendStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<IFormValues>({
    defaultValues: { displayName: "", message: "" },
  });

  //Lưu username người dùng nhập vào 
  const displayNameValue = watch("displayName");

  //Logic tìm người dùng bằng username
  const handleSearch = handleSubmit(async (data) => {
    const displayName = data.displayName.trim();
    if (!displayName) return;

    setIsFound(null);
    setSearchedDisplayName(displayName);

    try {
      const foundUser = await searchByDisplayName(displayName);
      if (foundUser) {
        setIsFound(true);
        setSearchUser(foundUser);
      } else {
        setIsFound(false);
      }
    } catch (error) {
      console.error("Error when find user",error);
      setIsFound(false);
    }
  });

  //Logic gửi lời mời kết bặn
  const handleSend = handleSubmit(async (data) => {
    if (!searchUser) return;

    try {
      const message = await addFriend(searchUser._id, data.message.trim());
      toast.success(message);

      handleCancel();
    } catch (error) {
      console.error("Error when send request", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error when send request add friend. Please try again"
      );
    }
  });

  //Reset nếu cancel
  const handleCancel = () => {
    reset();
    setSearchedDisplayName("");
    setIsFound(null);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title="Add friend"
          className="cursor-pointer"
        >
          <UserPlus className="size-4" />
          <span className="sr-only">Add friend</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle>Add friend</DialogTitle>
        </DialogHeader>

        {!isFound && (
          <>
            <SearchForm
              register={register}
              errors={errors}
              displayNameValue={displayNameValue}
              loading={loading}
              isFound={isFound}
              searchedDisplayName={searchedDisplayName}
              onSubmit={handleSearch}
              onCancel={handleCancel}
            />
          </>
        )}

        {isFound && (
          <>
            <SendFriendRequestForm
              register={register}
              loading={loading}
              foundDisplayName={searchUser?.displayName ?? searchedDisplayName}
              onSubmit={handleSend}
              onBack={() => setIsFound(null)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;
