//jotai
import { useAtom } from "jotai";
import { selectedTextAtom } from "@/state/store";
import { XMarkIcon } from "@heroicons/react/20/solid";

export default function SelectedText() {
  const [selectedText, setSelectedText] = useAtom(selectedTextAtom);

  const selectedTextExists = selectedText.length > 0;

  let content;
  if (selectedTextExists) {
    content = (
      <div className="flex items-center justify-between gap-x-2 w-full p-1 bg-gray-100 dark:bg-gray-700 rounded-r-lg">
        <span className="dark:text-gray-50 font-mono font-semibold w-full p-1 h-fit outline outline-4 outline-gray-200 bg-white dark:bg-gray-800 dark:outline-gray-700">
          {selectedText}
        </span>
        <XMarkIcon
          className="w-5 h-5 text-gray-500 dark:text-gray-400 cursor-pointer"
          onClick={() => setSelectedText("")}
        />
      </div>
    );
  } else {
    content = null;
  }
  return content;
}
