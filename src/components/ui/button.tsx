"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border text-xs font-semibold outline-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 data-loading:select-none data-loading:text-transparent [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-8 px-3",
        icon: "size-9 sm:size-8",
        "icon-lg": "size-10 sm:size-9",
        "icon-sm": "size-8 sm:size-7",
        "icon-xl":
          "size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        "icon-xs":
          "size-7 rounded-md before:rounded-[calc(var(--radius-md)-1px)] sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9",
        sm: "h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7",
        xl: "h-11 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        xs: "h-7 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-xs before:rounded-[calc(var(--radius-md)-1px)] sm:h-6 [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
      },
      variant: {
        default:
          "border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-100 data-pressed:bg-zinc-100 dark:border-[#282B29] dark:bg-[#191B1A] dark:text-zinc-100 dark:hover:bg-[#191B1A] dark:data-pressed:bg-[#191B1A]",
        primary:
          "border-[#CA8A04]/40 bg-[#EAB308] text-zinc-950 shadow-xs hover:bg-[#EAB308] data-pressed:bg-[#EAB308] *:data-[slot=button-loading-indicator]:text-zinc-950",
        neutral:
          "border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-100 data-pressed:bg-zinc-100 dark:border-[#282B29] dark:bg-[#191B1A] dark:text-zinc-100 dark:hover:bg-[#191B1A] dark:data-pressed:bg-[#191B1A]",
        destructive:
          "border-destructive bg-destructive text-white shadow-destructive/24 shadow-xs hover:bg-destructive data-pressed:bg-destructive *:data-[slot=button-loading-indicator]:text-white",
        "destructive-outline":
          "border-input bg-popover text-destructive-foreground hover:bg-popover data-pressed:bg-popover *:data-[slot=button-loading-indicator]:text-foreground",
        ghost:
          "border-transparent text-foreground hover:bg-transparent data-pressed:bg-transparent *:data-[slot=button-loading-indicator]:text-foreground",
        link: "border-transparent text-foreground underline-offset-4 hover:underline data-pressed:underline *:data-[slot=button-loading-indicator]:text-foreground",
        outline:
          "border-input bg-popover text-foreground hover:bg-popover data-pressed:bg-popover *:data-[slot=button-loading-indicator]:text-foreground dark:bg-input/32 dark:hover:bg-input/32 dark:data-pressed:bg-input/32",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary data-pressed:bg-secondary *:data-[slot=button-loading-indicator]:text-secondary-foreground",
      },
    },
  },
);

export interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  render,
  children,
  loading = false,
  disabled: disabledProp,
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled: boolean = Boolean(loading || disabledProp);
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button";

  const defaultProps = {
    children: (
      <>
        {children}
        {loading && (
          <Spinner
            className="pointer-events-none absolute"
            data-slot="button-loading-indicator"
          />
        )}
      </>
    ),
    className: cn(buttonVariants({ className, size, variant })),
    "aria-disabled": loading || undefined,
    "data-loading": loading ? "" : undefined,
    "data-slot": "button",
    disabled: isDisabled,
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}
