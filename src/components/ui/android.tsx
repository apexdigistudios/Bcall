import { type ReactNode, type SVGProps } from "react"

export interface AndroidProps extends SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  src?: string
  videoSrc?: string
  children?: ReactNode
}

const DEVICE_HEIGHT_SCALE = 0.88
const SCREEN_TOP = 14 * DEVICE_HEIGHT_SCALE
const SCREEN_HEIGHT = 800 * DEVICE_HEIGHT_SCALE

export function Android({
  width = 433,
  height = 882 * DEVICE_HEIGHT_SCALE,
  src,
  videoSrc,
  children,
  ...props
}: AndroidProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform={`scale(1 ${DEVICE_HEIGHT_SCALE})`}>
        <path
          d="M376 153H378C379.105 153 380 153.895 380 155V249C380 250.105 379.105 251 378 251H376V153Z"
          className="fill-[#E5E5E5] dark:fill-[#404040]"
        />
        <path
          d="M376 301H378C379.105 301 380 301.895 380 303V351C380 352.105 379.105 353 378 353H376V301Z"
          className="fill-[#E5E5E5] dark:fill-[#404040]"
        />
        <path
          d="M0 42C0 18.8041 18.804 0 42 0H336C359.196 0 378 18.8041 378 42V788C378 811.196 359.196 830 336 830H42C18.804 830 0 811.196 0 788V42Z"
          className="fill-[#E5E5E5] dark:fill-[#404040]"
        />
        <path
          d="M2 43C2 22.0132 19.0132 5 40 5H338C358.987 5 376 22.0132 376 43V787C376 807.987 358.987 825 338 825H40C19.0132 825 2 807.987 2 787V43Z"
          className="fill-white dark:fill-[#262626]"
        />
        <path
          d="M9.25 48C9.25 29.3604 24.3604 14.25 43 14.25H335C353.64 14.25 368.75 29.3604 368.75 48V780C368.75 798.64 353.64 813.75 335 813.75H43C24.3604 813.75 9.25 798.64 9.25 780V48Z"
          className="fill-[#E5E5E5] stroke-[#E5E5E5] stroke-[0.5] dark:fill-[#404040] dark:stroke-[#404040]"
        />
      </g>
      {children && (
        <foreignObject
          x="9"
          y={SCREEN_TOP}
          width="360"
          height={SCREEN_HEIGHT}
          clipPath="url(#clip0_514_20855)"
        >
          <div className="h-full w-full overflow-hidden">{children}</div>
        </foreignObject>
      )}
      <circle
        cx="189"
        cy="28"
        r="9"
        className="fill-white dark:fill-[#262626]"
      />
      <circle
        cx="189"
        cy="28"
        r="4"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      {src && (
        <image
          href={src}
          x="9"
          y={SCREEN_TOP}
          width="360"
          height={SCREEN_HEIGHT}
          className="object-cover"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#clip0_514_20855)"
        />
      )}
      {videoSrc && (
        <foreignObject
          x="9"
          y={SCREEN_TOP}
          width="360"
          height={SCREEN_HEIGHT}
          clipPath="url(#clip0_514_20855)"
          preserveAspectRatio="xMidYMid slice"
        >
          <video
            className="size-full object-cover"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
          />
        </foreignObject>
      )}
      <defs>
        <clipPath id="clip0_514_20855">
          <rect
            width="360"
            height={SCREEN_HEIGHT}
            rx="33"
            ry="25"
            className="fill-white dark:fill-[#262626]"
            transform={`translate(9 ${SCREEN_TOP})`}
          />
        </clipPath>
      </defs>
    </svg>
  )
}
