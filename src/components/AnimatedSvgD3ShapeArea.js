// @flow
import React, { Component } from 'react';
import { Svg } from 'expo';
import * as d3 from 'd3-shape';
import omit from 'lodash/omit';

import AnimatedSvgFix from './AnimatedSvgFix';
import { listen, removeListeners } from '../animatedListener';
import type { AnimatedListener } from '../animatedListener';

type Area = d3.Area;

const NativeSvgPath = Svg.Path;

export const args = [
    'x',
    'x0',
    'x1',
    'y',
    'y0',
    'y1',
    'defined',
    'curve',
    'lineX0',
    'lineY0',
    'lineX1',
    'lineY1'
];

function createGenerator(props, generator?: Area): Area {
    generator = generator || d3.area();
    return args.reduce((acc: Area, arg) => {
        const prop = props[arg];
        if (prop) {
            return acc[arg](prop);
        }
        return acc;
    }, generator);
}

function createPath(generator: Area, data): string {
    return generator(data);
}

class SvgD3ShapeArea extends Component {
    generator: Area;
    data: AnimatedListener;
    constructor(props) {
        super(props);
        this.generator = createGenerator(props);
        this.data = listen(props.data, _ => this.setNativeProps({ _listener: true }));
    }
    setNativeProps = (props = {}) => {
        const argChanged = args.some((key, index) => props[key] != null);
        if (argChanged) {
            this.generator = createGenerator(props, this.generator);
        }
        if (argChanged || props._listener) {
            props.d = createPath(this.generator, this.data.values);
        }
        this._component && this._component.setNativeProps(props);
    };
    shouldComponentUpdate(nextProps) {
        const argChanged = args.some(
            (key, index) => nextProps[key] !== this.props[key]
        );
        const dataChanged = nextProps.data !== this.props.data;
        if (argChanged) {
            this.generator = createGenerator(nextProps, this.generator);
        }
        if (dataChanged) {
            removeListeners(this.data.listeners, this.props.data);
            this.data = listen(nextProps.data, _ => this.setNativeProps({ _listener: true }));
        }
        return argChanged || dataChanged;
    }
    componentWillUnmount() {
        removeListeners(this.data.listeners, this.props.data);
    }
    render() {
        const filteredProps = omit(this.props, args);
        const d = createPath(this.generator, this.data.values);
        return (
            <NativeSvgPath
                ref={component => (this._component = component)}
                {...filteredProps}
                d={d}
            />
        );
    }
}
SvgD3ShapeArea = AnimatedSvgFix(SvgD3ShapeArea);
export default SvgD3ShapeArea;