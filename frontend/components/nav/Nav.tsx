import Link from "next/link";

import { ThemeSwitcher } from "@/components/theme-switcher";
import HeaderAuth from "@/components/header-auth";
import { SparklesIcon } from "@heroicons/react/20/solid";
import { createClient } from "@/utils/supabase/server";
import { FolderIcon } from "lucide-react";
export default async function Nav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 border-b">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="-ml-2 mr-2 flex items-center md:hidden"></div>
            <div className="flex items-center gap-x-1">
              <a
                href="/"
                className="flex items-center gap-x-1 hover:opacity-80 transition-opacity"
              >
                <h1 className="text-xl md:text-2xl text-nowrap lg:text-3xl text-gray-400 dark:text-white">
                  Lingo<em className="font-serif">Scribr</em> ai
                </h1>
                <SparklesIcon className="h-6 w-6 mb-6 text-gray-400 dark:text-white" />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-x-6">
            {user && (
              <Link href="/my-content">
                <FolderIcon className="h-6 w-6 text-gray-400 dark:text-white" />
              </Link>
            )}
            <ThemeSwitcher />
            <HeaderAuth user={user} />
          </div>
        </div>
      </div>
    </nav>
  );
}
