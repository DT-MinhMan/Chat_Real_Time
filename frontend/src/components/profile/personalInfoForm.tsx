import { useEffect } from "react";
import { Heart } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";
import type { UpdateProfilePayload, User } from "@/types/user";

type Props = {
  userInfo: User | null;
};

const PHONE_PATTERN = /^(0\d{9,10}|\+84\d{9,10})$/;

const PersonalInfoForm = ({ userInfo }: Props) => {
  const { updateProfile } = useUserStore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfilePayload>({
    defaultValues: {
      displayName: userInfo?.displayName ?? "",
      bio: userInfo?.bio ?? "",
      phone: userInfo?.phone ?? "",
    },
  });

  useEffect(() => {
    reset({
      displayName: userInfo?.displayName ?? "",
      bio: userInfo?.bio ?? "",
      phone: userInfo?.phone ?? "",
    });
  }, [reset, userInfo]);

  if (!userInfo) return null;

  const onSubmit = async (data: UpdateProfilePayload) => {
    await updateProfile({
      displayName: data.displayName.trim(),
      bio: data.bio?.trim() ?? "",
      phone: data.phone?.trim() ?? "",
    });
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Personal information
        </CardTitle>
        <CardDescription>
          Update your personal details and profile information.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                className="glass-light border-border/30"
                {...register("displayName", {
                  validate: (value) => {
                    const trimmed = value.trim();

                    if (!trimmed) return "Display name is required.";
                    if (trimmed.length < 2 || trimmed.length > 50) {
                      return "Display name must be from 2 to 50 characters.";
                    }

                    return true;
                  },
                })}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">User name</Label>
              <Input
                id="username"
                value={userInfo.username}
                disabled
                readOnly
                className="glass-light border-border/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userInfo.email}
                disabled
                readOnly
                className="glass-light border-border/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                className="glass-light border-border/30"
                {...register("phone", {
                  validate: (value) => {
                    const trimmed = value?.trim() ?? "";

                    if (!trimmed || PHONE_PATTERN.test(trimmed)) {
                      return true;
                    }

                    return "Phone number is invalid.";
                  },
                })}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Introduce</Label>
            <Textarea
              id="bio"
              rows={3}
              className="glass-light border-border/30 resize-none"
              {...register("bio", {
                validate: (value) =>
                  (value?.trim().length ?? 0) <= 500 ||
                  "Introduce must be 500 characters or less.",
              })}
            />
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
