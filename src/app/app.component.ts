import { Component } from '@angular/core';

import {matrix, dotPow, multiply, inv, parse} from 'mathjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  distance: number = 20;
  offset: number = 0;
  sag: number = 2;

  bridge: Bridge;


  // Parabola
  // y = Ax² + Bx + C
  constructor() {
    // this._parabolic = parse('y = a * x^2 + b * x + c');
    // console.log(this._parabolic);
  }

  compute() {
    this.bridge = new Bridge(this.distance, this.offset, this.sag);
  }
}

export interface Point {
  x: number;
  y: number;
}

export class Bridge {

  private _resolutionPerBlock = 2;

  private _distance;
  private _slope;
  private _sag;

  get left(): Point {

    return {
      x: 0,
      y: this._slope < 0 ? 0 : Math.abs(this._slope)
    }
  }

  get right(): Point {

    return {
      x: Math.abs(this._distance),
      y: this._slope > 0 ? 0 : Math.abs(this._slope)
    }
  }

  get vertex(): Point {
    return {x: Math.abs(this._distance / 2), y: Math.abs(this._slope) + Math.abs(this._sag) }
  }

  get grid() {
    return this._grid;
  }

  private _rawSlope: boolean[][];
  private _grid: BlockType[][];

  constructor(distance: number, slope: number, sag: number) {

    if(distance <= 0) {
      throw Error('Distance msut be positive');
    }

    this._distance = distance;
    this._slope = slope;
    this._sag = sag;

    this.createRawSlope();
    this.convertToBlocks();
  }

  private createRawSlope() {

    const width = this._distance;
    const height = Math.abs(this._slope) + Math.abs(this._sag) + 1;

    this._rawSlope = this.create2DArray(height * this._resolutionPerBlock, width * this._resolutionPerBlock);

    this.fillRawSlope();
    this.convertToBlocks();
  }

  private fillRawSlope() {

    const parabolicEqation = this.getParabolicEquation();
    const parabola = parse(parabolicEqation);

    for(let i = 0; i < this._rawSlope[0].length; i++) {
      const x = (i / this._resolutionPerBlock) + (1 / this._resolutionPerBlock / this._resolutionPerBlock);

      const rawY = parabola.evaluate({x: x});

      const adjustedY = rawY * this._resolutionPerBlock;
      const roundedY = Math.round(adjustedY);
      const y = roundedY < this._rawSlope.length ? roundedY : this._rawSlope.length - 1;

      this._rawSlope[y][i] = true;
    }
  }

  private convertToBlocks() {
    const rows = this._rawSlope.length / this._resolutionPerBlock;
    const cols = this._rawSlope[0].length / this._resolutionPerBlock;

    this._grid = this.create2DArray(rows, cols);

    for(let r = 0; r < rows; r++) {
      for(let c = 0; c < cols; c++) {

        let blockCode = '';
        for(let i = 0; i < this._resolutionPerBlock; i++) {
          for(let j = 0; j < this._resolutionPerBlock; j++) {
            const rawR = r * this._resolutionPerBlock + i;
            const rawC = c * this._resolutionPerBlock + j;

            const val = this._rawSlope[rawR][rawC];

            console.log(rawR, rawC, val);

            blockCode += val === true ? '1' : '0';

            this._grid[r][c] = this._blockTypeCodes[blockCode];
          }
        }
      }
    }
  }

  private _blockTypeCodes: {[code: string]: BlockType} = {
    '0000': null,
    '1100': "slab-top",
    '0011': "slab-bottom",
    '1001': "stairs-left",
    '0110': 'stairs-right'
  }

  private getParabolicEquation(): string {

    const points: Point[] = [
      this.left,
      this.right,
      this.vertex
    ];

    const xArray = [];
    const yArray = [];

    for(let i = 0; i < points.length; i++) {
      const p = points[i];
      xArray.push([dotPow(p.x, 2), p.x, 1]);
      yArray.push([p.y]);
    }
    
    const xMatrix = matrix(xArray);
    const yMatrix = matrix(yArray);
    const xMatrixInverse = inv(xMatrix);

    const parabolaMatrix = multiply(xMatrixInverse, yMatrix);
    const parabolaArray = parabolaMatrix.valueOf();

    const parabolicString = `${parabolaArray[0][0]}x^2 + ${parabolaArray[1][0]}x + ${parabolaArray[2][0]}`;

    return parabolicString;
  }

  private create2DArray(rows: number, cols: number) {
    console.log(`[${rows}, ${cols}]`)
    let arr = new Array(rows);

    for(let i = 0; i < rows; i++ ){
      arr[i] = new Array(cols).fill(null);
    }

    return arr;
  }
}

export type BlockType = 'stairs-left' | 'slab-top' | 'slab-bottom' | 'stairs-right';