import React from "react";
import * as LucideIcons from "lucide-react";

function Icon({
  name,
  size = 24,
  color = "currentColor",
  className = "",
  strokeWidth = 2,
  ...props
}) {
  const IconComponent = LucideIcons?.[name];

  if (!IconComponent) {
    const FallbackIcon =
      LucideIcons?.CircleHelp ||
      LucideIcons?.HelpCircle ||
      LucideIcons?.AlertCircle ||
      null;

    if (FallbackIcon) {
      return (
        <FallbackIcon
          size={size}
          color="gray"
          strokeWidth={strokeWidth}
          className={className}
          {...props}
        />
      );
    }
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}
export default Icon;
