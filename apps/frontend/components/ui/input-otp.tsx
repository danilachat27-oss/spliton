"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";

import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & { index: number }) {
  const ctx = React.useContext(OTPInputContext);
  const slot = ctx.slots?.[index];
  if (!slot) return null;

  return (
    <div
      className={cn(
        "relative flex h-[52px] min-w-0 flex-1 items-center justify-center rounded-lg bg-[#F5F5F5] text-[22px] font-semibold tabular-nums text-neutral-900",
        slot.isActive && "z-10",
        className
      )}
      {...props}
    >
      {slot.char}
      {slot.hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-0.5 bg-[#00C076]" />
        </div>
      ) : null}
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot };
