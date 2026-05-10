export function TextError (props) {
    return <div className="sharp-sans font-bold text-red-600 text-[13px] !mt-1 w-full max-w-[300px] md:max-w-full">{props.children}</div>;
}

export const classes = (...args) => args.join(" ");