import { Marker } from "../marker/marker";
import { Observable, reactive } from "../../util/observable";
import { Circle } from "../marker/circle";

export class SeriesMarker extends Observable {

    @reactive(['change']) enabled = true;

    /**
     * Marker constructor function. A series will create one marker instance per data point.
     */
    @reactive(['change']) type: new () => Marker = Circle;

    @reactive(['change']) size = 8;

    /**
     * In case a series has the `sizeKey` set, the `sizeKey` values along with the `minSize/size` configs
     * will be used to determine the size of the marker. All values will be mapped to a marker size
     * within the `[minSize, size]` range, where the largest values will correspond to the `size`
     * and the lowest to the `minSize`.
     */
    @reactive(['change']) minSize = 12;

    @reactive(['change']) fill?: string;

    @reactive(['change']) stroke?: string;

    @reactive(['change']) strokeWidth?: number;
}

export interface SeriesMarkerFormatterParams {
    datum: any;
    fill?: string;
    stroke?: string;
    strokeWidth: number;
    size: number;
    highlighted: boolean;
}
