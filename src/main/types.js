/*
 * MIT License
 *
 * Copyright (c) 2017 Uber Node.js
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// @flow

import {BaseType, ListType, MapType, SetType} from 'thriftrw/ast';

export class TypeConverter {
  static primitives = {
    binary: 'Buffer',
    bool: 'boolean',
    byte: 'number',
    i8: 'number',
    i16: 'number',
    i32: 'number',
    i64: 'Buffer',
    double: 'number',
    string: 'string',
    void: 'void'
  };

  static i64Mappings = {
    Long: 'Long',
    Date: 'Date'
  };

  transformName: string => string;

  constructor(transformName: string => string) {
    this.transformName = transformName;
  }

  annotation(t: BaseType): string {
    const jsType = t.annotations && t.annotations['js.type'];
    // https://github.com/thriftrw/thriftrw-node/blob/8d36b5b83e5d22bf6c28339e3e894eb4926e556f/i64.js#L179
    if (t.baseType === 'i64' && jsType) {
      return TypeConverter.i64Mappings[jsType];
    }
    return '';
  }

  transformOrNot(name: string, imports?: Set<string>): string {
    if (imports) {
      const arr = name.split('.');
      if (arr.length > 1) {
        if (imports.has(arr[0])) {
          return name;
        }
      }
    }
    return this.transformName(name);
  }

  convert = (t: BaseType, imports?: Set<string>): string =>
    this.arrayType(t, imports) ||
    this.mapType(t, imports) ||
    this.annotation(t) ||
    TypeConverter.primitives[t.baseType] ||
    this.transformOrNot(t.name, imports)

  arrayType = (thriftValueType: BaseType, imports?: Set<string>) =>
    (thriftValueType instanceof ListType || thriftValueType instanceof SetType) &&
    `${this.convert(thriftValueType.valueType, imports)}[]`;

  mapType(t: BaseType, imports?: Set<string>) {
    if (t instanceof MapType) {
      const ktype = this.convert(t.keyType, imports);
      const vtype = this.convert(t.valueType, imports);
      return `{[${ktype}]: ${vtype}}`;
    }
    return null;
  }
}
