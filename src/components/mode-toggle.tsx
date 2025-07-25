import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider" //  Adjust path if needed
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"

export function ModeToggle() {
  const { setTheme } = useTheme()
  const { t } = useTranslation(); // For i18n if needed for "Light", "Dark", "System"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {t('themeLight', { ns: 'common', defaultValue: 'Light' })}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {t('themeDark', { ns: 'common', defaultValue: 'Dark' })}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {t('themeSystem', { ns: 'common', defaultValue: 'System' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}