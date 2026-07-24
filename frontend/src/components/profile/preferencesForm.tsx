import { Sun, Moon } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/store/useThemeStore";

const PreferencesForm = () => {
    const { isDark, toggleTheme } = useThemeStore();

    return (
        <Card className="glass-strong border-border/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-primary" />
                    Customize the app
                </CardTitle>
                <CardDescription>Personalize your chat experience.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label
                            htmlFor="theme-toggle"
                            className="text-base font-medium"
                        >
                            Dark mode
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Switch between light and dark interfaces.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-muted-foreground" />
                        <Switch
                            id="theme-toggle"
                            checked={isDark}
                            onCheckedChange={toggleTheme}
                            className="data-[state=checked]:bg-primary-glow"
                        />
                        <Moon className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};

export default PreferencesForm;