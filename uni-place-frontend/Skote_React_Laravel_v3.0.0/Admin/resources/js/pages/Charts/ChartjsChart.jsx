import React from "react"

import { Row, Col, Card, CardBody, CardTitle, Container } from "reactstrap"
//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb"

// import chartJs
import LineChart from "../AllCharts/chartjs/linechart"
import DountChart from "../AllCharts/chartjs/dountchart"
import PieChart from "../AllCharts/chartjs/piechart"
import BarChart from "../AllCharts/chartjs/barchart"
import RadarChart from "../AllCharts/chartjs/radarchart"
import PolarChart from "../AllCharts/chartjs/polarchart"

const ChartjsChart = () => {
  //meta title
  document.title = "Chartjs Charts | Skote - React Admin & Dashboard Template"

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid={true}>
          <Breadcrumbs title="Charts" breadcrumbItem="Chartjs Charts" />
          <Row>
            <Col xl={6}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">Line Chart</CardTitle>
                  <Row className="justify-content-center">
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">86541</h5>
                        <p className="text-muted text-truncate">Activated</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">2541</h5>
                        <p className="text-muted text-truncate">Pending</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">102030</h5>
                        <p className="text-muted text-truncate">Deactivated</p>
                      </div>
                    </Col>
                  </Row>
                  <div id="lineChart" className="chartjs-render-monitor">
                    <LineChart dataColors='["--bs-primary-rgb, 0.2", "--bs-primary", "--bs-light-rgb, 0.2", "--bs-light"]' />
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={6}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">Bar Chart</CardTitle>
                  <Row className="justify-content-center">
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">2541</h5>
                        <p className="text-muted text-truncate">Activated</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">84845</h5>
                        <p className="text-muted text-truncate">Pending</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">12001</h5>
                        <p className="text-muted text-truncate">Deactivated</p>
                      </div>
                    </Col>
                  </Row>

                  <div id="bar" className="chartjs-render-monitor">
                    <BarChart dataColors='["--bs-success-rgb, 0.8", "--bs-success"]' />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col xl={6}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">Pie Chart</CardTitle>
                  <Row className="justify-content-center">
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">2536</h5>
                        <p className="text-muted text-truncate">Activated</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">69421</h5>
                        <p className="text-muted text-truncate">Pending</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">89854</h5>
                        <p className="text-muted text-truncate">Deactivated</p>
                      </div>
                    </Col>
                  </Row>
                  <div id="pie" style={{ display: "block", width: "715px", height: "260px" }}>
                    <PieChart dataColors='["--bs-success", "#ebeff2"]' />
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={6}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">Donut Chart</CardTitle>
                  <Row className="justify-content-center">
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">9595</h5>
                        <p className="text-muted text-truncate">Activated</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">36524</h5>
                        <p className="text-muted text-truncate">Pending</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">62541</h5>
                        <p className="text-muted text-truncate">Deactivated</p>
                      </div>
                    </Col>
                  </Row>

                  <div id="doughnut" style={{ display: "block", width: "715px", height: "260px" }}>
                    <DountChart dataColors='["--bs-primary", "#ebeff2"]' />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col xl={6}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">Polar Chart</CardTitle>
                  <Row className="justify-content-center">
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">4852</h5>
                        <p className="text-muted text-truncate">Activated</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">3652</h5>
                        <p className="text-muted text-truncate">Pending</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">85412</h5>
                        <p className="text-muted text-truncate">Deactivated</p>
                      </div>
                    </Col>
                  </Row>
                  <div id="polarArea" style={{ display: "block", width: "715px", height: "300px" }}>
                    <PolarChart dataColors='["--bs-danger", "--bs-success", "--bs-warning", "--bs-primary"]' />
                  </div>
                </CardBody>
              </Card>
            </Col>

            <Col xl={6}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">Radar Chart</CardTitle>
                  <Row className="justify-content-center">
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">694</h5>
                        <p className="text-muted text-truncate">Activated</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">55210</h5>
                        <p className="text-muted text-truncate">Pending</p>
                      </div>
                    </Col>
                    <Col sm={4}>
                      <div className="text-center">
                        <h5 className="mb-0">489498</h5>
                        <p className="text-muted text-truncate">Deactivated</p>
                      </div>
                    </Col>
                  </Row>

                  <div id="radar" style={{ display: "block", width: "715px", height: "300px" }}>
                    <RadarChart dataColors='["--bs-success-rgb, 0.2", "--bs-success", "--bs-primary-rgb, 0.2", "--bs-primary"]' />
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>{" "}
        </Container>
      </div>
    </React.Fragment>
  )
}

export default ChartjsChart
