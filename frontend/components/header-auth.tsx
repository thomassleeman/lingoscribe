import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
// import { createClient } from "@/utils/supabase/server";
import { CircleUser } from "lucide-react";

export default async function AuthButton({ user }) {
  // const supabase = await createClient();

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  return user ? (
    <div className="relative group">
      <div className="flex items-center cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200">
        <CircleUser size={28} className="text-gray-500 dark:text-gray-100" />
      </div>
      <div className="absolute z-50 right-0 mt-2 w-48 bg-white dark:bg-slate-800 dark:text-gray-100 rounded-md shadow-lg border border-gray-200 overflow-hidden invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
        <form action={signOutAction} className="py-1">
          <Button
            type="submit"
            variant="ghost"
            className="w-full text-left px-4 py-2 text-sm"
          >
            Sign out
          </Button>
        </form>
      </div>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
