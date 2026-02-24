import React, { useState } from "react";
import { Row, Col, Card, CardBody, CardTitle, Container } from "reactstrap"
//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb"

import Slider from "rc-slider";
import 'rc-slider/assets/index.css';

const UiRangeSlider = () => {

   //meta title
   document.title = "Range Slider | Skote React + Laravel Admin And Dashboard Template";

   const [value, setValue] = useState(50);

   const handleSliderChange = (newValue) => {
     setValue(newValue);
   };
 
   const [range, setRange] = useState([30, 90]);
 
   const handleSliderChange1 = (newRange) => {
     setRange([Math.max(newRange[0], 30), Math.min(newRange[1], 90)]);
   };
 
   const [range2, setRange2] = useState([30, 70]);
 
   const handleSliderChange2 = (newRange) => {
     setRange2([Math.max(newRange[0], 30), Math.min(newRange[1], 70)]);
   };
   const [range3, setRange3] = useState([20, 60]);
 
   const handleSliderChange3 = (newRange) => {
     setRange3([Math.max(newRange[0], 20), Math.min(newRange[1], 60)]);
   };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid={true}>
          <Breadcrumbs title="UI Elements" breadcrumbItem="Range Slider" />

          <Row>
            <Col className="col-12">
              <Card>
              <CardBody>
                  <CardTitle>React Rangeslider</CardTitle>
                  <p className="card-title-desc">Cool, comfortable, responsive and easily customizable range slider</p>
                  <Row>
                    <Col xl={6}>
                      <div className="p-3">
                        <h5 className="font-size-14 mb-3 mt-0">Default</h5>
                        <Slider
                          min={0}
                          max={100}
                          value={value}
                          onChange={handleSliderChange}
                          trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                          handleStyle={{
                            borderColor: "#838de7",
                            height: 20,
                            width: 20,
                            marginTop: -8,
                            backgroundColor: "#838de7",
                          }}
                          railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                        />
                      </div>
                    </Col>

                    <Col xl={6}>
                      <div className="p-3">
                        <h5 className="font-size-14 mb-3 mt-0">Min-Max</h5>
                        <Slider
                          // range={range}
                          min={100}
                          max={200}
                          value={range}
                          onChange={handleSliderChange1}
                          trackStyle={[{ backgroundColor: "#838de7", height: 5 }]}
                          handleStyle={[
                            {
                              borderColor: "#838de7",
                              height: 20,
                              width: 20,
                              marginTop: -8,
                              backgroundColor: "#838de7",
                            },
                            {
                              borderColor: "#838de7",
                              height: 20,
                              width: 20,
                              marginTop: -8,
                              backgroundColor: "#838de7",
                            },
                          ]}
                          railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                        />
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col xl={6}>
                      <div className="p-3">
                        <h5 className="font-size-14 mb-3 mt-0">Prefix</h5>
                        <Slider
                          min={0}
                          max={100}
                          value={range2}
                          // range={range2}
                          onChange={handleSliderChange2}
                          trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                          handleStyle={{
                            borderColor: "#838de7",
                            height: 20,
                            width: 20,
                            marginTop: -8,
                            backgroundColor: "#838de7",
                          }}
                          railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                        />
                      </div>
                    </Col>

                    <Col xl={6}>
                      <div className="p-3">
                        <h5 className="font-size-14 mb-3 mt-0">Postfixes</h5>
                        <Slider
                          min={0}
                          max={100}
                          value={range3}
                          // range={range3}
                          onChange={handleSliderChange3}
                          trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                          handleStyle={{
                            borderColor: "#838de7",
                            height: 20,
                            width: 20,
                            marginTop: -8,
                            backgroundColor: "#838de7",
                          }}
                          railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                        />
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col xl={6}>
                      <div className="p-3">
                        <h5 className="font-size-14 mb-3 mt-0">Step</h5>
                        <Slider
                          min={0}
                          max={100}
                          value={10}
                          onChange={handleSliderChange}
                          trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                          handleStyle={{
                            borderColor: "#838de7",
                            height: 20,
                            width: 20,
                            marginTop: -8,
                            backgroundColor: "#838de7",
                          }}
                          railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                        />
                      </div>
                    </Col>

                    <Col xl={6}>
                      <div className="p-3">
                        <h5 className="font-size-14 mb-3 mt-0">
                          Custom Values
                        </h5>
                        <Slider
                          min={0}
                          max={100}
                          value={range3}
                          // range={range3}
                          onChange={handleSliderChange3}
                          trackStyle={{ backgroundColor: "#d7dada", height: 5 }}
                          handleStyle={{
                            borderColor: "#838de7",
                            height: 20,
                            width: 20,
                            marginTop: -8,
                            backgroundColor: "#838de7",
                          }}
                          railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                        />
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col xl={6}>
                      <div className="p-3">
                        <h5 className="font-size-14 mb-3 mt-0">Reverse</h5>
                        <span className="float-start mt-4">100</span>{" "}
                        <span className="float-end mt-4">0</span>
                        <Slider
                          min={0}
                          max={100}
                          marks={{ 10: 10, 20: 20, 30: 30, 40: 40, 50: 50, 60: 60, 70: 70, 80: 80, 90: 90 }}
                          reverse={true}
                          value={range3}
                          // range={range3}
                          onChange={handleSliderChange3}
                          trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                          handleStyle={{
                            borderColor: "#838de7",
                            height: 20,
                            width: 20,
                            marginTop: -8,
                            backgroundColor: "#838de7",
                          }}
                          railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                        />
                      </div>
                    </Col>

                    <Col xl={6}>
                      <div className="p-3">
                        <h5 className="font-size-14 mb-3 mt-0">
                          Prettify Numbers
                        </h5>
                        <span className="float-start mt-4">1</span>{" "}
                        <span className="float-end mt-4">100</span>
                        <Slider
                          min={0}
                          max={100}
                          marks={{ 10: "10%", 20: "20%", 30: "30%", 40: "40%", 50: "50%", 60: "60%", 70: "70%", 80: "80%", 90: "90%" }}
                          value={range3}
                          // range={range3}
                          onChange={handleSliderChange3}
                          trackStyle={{ backgroundColor: "#838de7", height: 5 }}
                          handleStyle={{
                            borderColor: "#838de7",
                            height: 20,
                            width: 20,
                            marginTop: -8,
                            backgroundColor: "#838de7",
                          }}
                          railStyle={{ backgroundColor: "#d7dada", height: 5 }}
                        />
                      </div>
                    </Col>

                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default UiRangeSlider
