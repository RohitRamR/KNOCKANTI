import React from 'react';
import { Card, Button } from '../components/ui/Components';
import { Settings as SettingsIcon, Moon, Sun, Bell, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="space-y-6">
            <Card className="flex items-center gap-4 py-8 border border-border">
                <div className="p-4 bg-bg-secondary rounded-full text-text-secondary">
                    <SettingsIcon size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
                    <p className="text-text-secondary">Manage application preferences.</p>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                {/* Appearance */}
                <Card className="border border-border">
                    <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">
                        Appearance
                    </h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <div>
                                <p className="font-medium text-text-primary">Theme Mode</p>
                                <p className="text-sm text-text-secondary">Switch between dark and light themes</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={toggleTheme}>
                            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                        </Button>
                    </div>
                </Card>

                {/* Notifications */}
                <Card className="border border-border">
                    <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-2">
                        Notifications
                    </h3>
                    <div className="flex items-center justify-between opacity-50 pointer-events-none">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-text-primary">Push Notifications</p>
                                <p className="text-sm text-text-secondary">Receive alerts for new orders</p>
                            </div>
                        </div>
                        <div className="w-12 h-6 bg-bg-secondary rounded-full relative">
                            <div className="w-6 h-6 bg-bg-card rounded-full shadow-sm absolute left-0"></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
