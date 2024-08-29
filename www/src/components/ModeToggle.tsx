"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { DropdownMenu, IconButton } from "@radix-ui/themes";
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'


export function ModeToggle() {
    const { resolvedTheme, setTheme } = useTheme();

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <IconButton variant="ghost" size="3">
                    {
                        resolvedTheme == "light" && (
                            <SunIcon />
                        )
                    }
                    {
                        resolvedTheme == "dark" && (
                            <MoonIcon />
                        )
                    }
                </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item onClick={() => setTheme("light")}>
                    Light
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => setTheme("dark")}>
                    Dark
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => setTheme("system")}>
                    System
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
