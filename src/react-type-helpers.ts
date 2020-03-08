import { ComponentClass, FunctionComponent, ReactNode, StatelessComponent } from "react"

export type AnyComponent<TProps> = ComponentClass<TProps> | StatelessComponent<TProps> | FunctionComponent<TProps>

export type AnyChildren = ReactNode | ReactNode[]
