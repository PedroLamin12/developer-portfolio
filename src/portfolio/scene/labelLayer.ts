import { createRef } from "react";

// Stable DOM container for drei <Html> labels. Without it drei re-parents (and
// remounts) every label once the canvas event layer connects.
export const labelLayer = createRef<HTMLDivElement>() as React.MutableRefObject<HTMLDivElement>;
