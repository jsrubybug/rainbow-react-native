import React, { useMemo, useState, useRef } from 'react';
import ValueChart from './ValueChart';
import ValueText from './ValueText';
import {
  // data1,
  // data2,
  // data3,
  data4,
  dataColored1,
  dataColored2,
  dataColored3,
} from './data';
import TimespanSelector from './TimespanSelector';
import { colors } from '../../styles';

const dataColored = [dataColored1, dataColored2, dataColored3];
const dataSwitching = [
  dataColored,
  [dataColored1, dataColored2],
  [dataColored2, dataColored3],
  [data4],
];

const colorsArray = [
  colors.red,
  colors.grey,
  colors.green,
  colors.purple,
  colors.red,
  colors.green,
  colors.red,
  colors.purple,
  colors.green,
  colors.grey,
  colors.green,
  colors.purple,
];

let colorIndex = 0;

export default function Chart() {
  const textInputRef = useRef(null);
  const data = useMemo(() => {
    colorIndex = 0;
    return dataSwitching.map((sectionsData, index) => {
      return {
        name: index,
        segments: sectionsData.map((data, i) => {
          return {
            color: colorsArray[colorIndex++],
            line: i * 5,
            points: data.map(values => {
              return { x: values.timestamp, y: values.value };
            }),
            renderStartSeparator:
              colorIndex % 2 !== 0
                ? {
                    fill: colorsArray[colorIndex],
                    r: 7,
                    stroke: 'white',
                    strokeWidth: colorIndex + 2,
                  }
                : undefined,
          };
        }),
      };
    });
  }, []);

  const [currentChart, setCurrentChart] = useState(0);
  const change = currentChart % 2 === 0 ? 20 : -20; // placeholder

  return (
    <>
      <ValueText
        headerText="PRICE"
        direction={change > 0}
        change={change.toFixed(2)}
        ref={textInputRef}
      />
      <ValueChart
        mode="gesture-managed" // "gesture-managed" / "detailed" / "simplified"
        enableSelect // enable checking value in touched point of chart
        onValueUpdate={value => {
          textInputRef.current.updateValue(value);
        }}
        currentDataSource={currentChart}
        amountOfPathPoints={100} // amount of points for switch between charts
        data={data}
        barColor={change > 0 ? colors.chartGreen : colors.red}
        stroke={{ detailed: 1.5, simplified: 3 }}
      />
      <TimespanSelector
        reloadChart={setCurrentChart}
        color={change > 0 ? colors.chartGreen : colors.red}
        isLoading={false}
      />
    </>
  );
}