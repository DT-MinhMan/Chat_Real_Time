import { useFriendStore } from "@/store/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";

//Hiển thị pop up gửi lời mời kết bạn 
const SentRequests = () => {
  const { sentList } = useFriendStore();

  if (!sentList || sentList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You haven't sent any friend requests yet.
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <>
        {sentList.map((req) => (
          <FriendRequestItem
            key={req._id}
            requestInfo={req}
            type="sent"
            actions={
              <p className="text-muted-foreground text-sm">Waiting for a reply...</p>
            }
          />
        ))}
      </>
    </div>
  );
};

export default SentRequests;