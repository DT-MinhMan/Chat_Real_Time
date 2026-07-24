import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router";

//Dùng thư viện zod kiểm tra form đăng nhập có hợp lệ hay không 
const signInSchema = z.object({
  username: z.string().min(3, "User name must have at least 3 characters"),
  password: z.string().min(6, "Password must have at leat 6 characters"),
});

//Zod tự động đọc cái schema ở trên và dịch nó thành một Type của TypeScript
// type SignInFormValues = {
//   firstname: string;
//   lastname: string;
//   username: string;
//   email: string;
//   password: string;
// }
type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm({className,...props}: React.ComponentProps<"div">) {

  //Móc nối với store
  const { signIn } = useAuthStore();
  const navigate = useNavigate();

  //Thiết lập form đăng ký, hiển thị lỗi dựa trên signUpSchema
  const {register, handleSubmit, formState: { errors, isSubmitting },} = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  //Gọi store để sign in
  const onSubmit = async (data: SignInFormValues) => {
    const { username, password } = data;
    await signIn(username, password);
    navigate("/");
  };
  return (
    <div className={cn("flex flex-col gap-6", className)}
     {...props}
     >
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
              {/* Header & Logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <a
                  href="/"
                  className="mx-auto block w-fit text-center"
                >
                  <img
                    src="/logo.svg"
                    alt="logo"
                  />
                </a>

                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Log in your account here
                </p>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="username"
                  className="block text-sm"
                >
                  User name
                </Label>
                <Input
                  type="text"
                  id="username"
                  placeholder="John Doe"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-destructive text-sm">
                    {errors.username.message}
                  </p>
                )}
              </div>    

              {/* Password */}
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="password"
                  className="block text-sm"
                >
                  Mật khẩu
                </Label>
                <Input
                  type="password"
                  id="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Nút đăng nhập */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                Log in
              </Button>

              <div className="text-center text-sm">
                You don't have an account?{" "}
                <a
                  href="/signup"
                  className="underline underline-offset-4"
                >
                  Sign up
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute inset-0 top-1/2 -translate-y-1/2 object-cover "
            />
          </div>
        </CardContent>
      </Card>
      <div className=" text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offetset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}