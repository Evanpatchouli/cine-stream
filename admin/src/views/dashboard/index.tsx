import { useAsyncEffect, useTitle } from "@evanpatchouli/react-hooks-kit";
import * as LoginLogAPI from "@/api/login-log.api";
import { useState } from "react";
import { Row, Col, Statistic, Card, Table, Tag } from "antd";
import {
  FieldTimeOutlined,
  CalendarOutlined,
  FundOutlined,
  RiseOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import EChartsReact from "echarts-for-react";
import type { ColumnsType } from "antd/es/table";

// 定义数据类型
interface DailyLoginData {
  date: string;
  count: number;
  growth: number;
}

export default function DashboardView() {
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [weeklyCount, setWeeklyCount] = useState<number>(0);
  const [monthlyCount, setMonthlyCount] = useState<number>(0);
  const [yearlyCount, setYearlyCount] = useState<number>(0);
  const [trendData, setTrendData] = useState<DailyLoginData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useTitle("仪表盘 - WebApp");

  useAsyncEffect(async () => {
    setLoading(true);
    try {
      const [daily, weekly, monthly, yearly, trend] = await Promise.all([
        LoginLogAPI.count("daily"),
        LoginLogAPI.count("weekly"),
        LoginLogAPI.count("monthly"),
        LoginLogAPI.count("yearly"),
        LoginLogAPI.getTrendData(), // 假设有获取趋势数据的API
      ]);

      setDailyCount(daily.getData() || 0);
      setWeeklyCount(weekly.getData() || 0);
      setMonthlyCount(monthly.getData() || 0);
      setYearlyCount(yearly.getData() || 0);
      setTrendData(trend.getData()!); // 如果没有API，使用模拟数据
    } finally {
      setLoading(false);
    }
  }, []);

  // 折线图配置
  const lineChartOption = {
    title: {
      text: "近7日登录趋势",
      left: "center",
      top: 10,
      textStyle: { fontSize: 16, fontWeight: "normal" },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: function (params: any) {
        return `${params[0].name}<br/>登录人次: ${params[0].value}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: trendData?.map((item) => item.date) || [],
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: "value",
      name: "登录人次",
      nameStyle: { fontSize: 12 },
      axisLabel: { fontSize: 12 },
    },
    series: [
      {
        name: "登录人次",
        type: "line",
        data: trendData?.map((item) => item.count) || [0, 0, 0, 0, 0, 0, 0],
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#1890ff" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(24,144,255,0.3)" },
              { offset: 1, color: "rgba(24,144,255,0.01)" },
            ],
          },
        },
        label: {
          show: true,
          position: "top",
          fontSize: 12,
          formatter: "{c}",
        },
      },
    ],
  };

  // 表格列配置
  const columns: ColumnsType<DailyLoginData> = [
    {
      title: "日期",
      dataIndex: "date",
      key: "date",
      align: "center",
    },
    {
      title: "登录人次",
      dataIndex: "count",
      key: "count",
      align: "center",
      sorter: (a, b) => a.count - b.count,
      render: (value) => <span style={{ fontWeight: "bold" }}>{value}</span>,
    },
    {
      title: "环比增长",
      dataIndex: "growth",
      key: "growth",
      align: "center",
      sorter: (a, b) => a.growth - b.growth,
      render: (value) => (
        <Tag
          color={value >= 0 ? "success" : "error"}
          icon={value >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        >
          {value >= 0 ? "+" : ""}
          {value}%
        </Tag>
      ),
    },
  ];

  // 统计数据列配置
  const statisticsColumns: ColumnsType<any> = [
    {
      title: "统计项",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "数值",
      dataIndex: "value",
      key: "value",
      align: "right",
    },
    {
      title: "占比",
      dataIndex: "percentage",
      key: "percentage",
      align: "right",
    },
  ];

  // 统计数据
  const statisticsData = [
    {
      key: "1",
      name: "今日登录",
      value: dailyCount,
      percentage: `${((dailyCount / yearlyCount) * 100 || 0).toFixed(1)}%`,
    },
    {
      key: "2",
      name: "本周登录",
      value: weeklyCount,
      percentage: `${((weeklyCount / yearlyCount) * 100 || 0).toFixed(1)}%`,
    },
    {
      key: "3",
      name: "本月登录",
      value: monthlyCount,
      percentage: `${((monthlyCount / yearlyCount) * 100 || 0).toFixed(1)}%`,
    },
    {
      key: "4",
      name: "本年登录",
      value: yearlyCount,
      percentage: "100%",
    },
    {
      key: "5",
      name: "日均登录",
      value: Math.round(weeklyCount / 7),
      percentage: "-",
    },
    {
      key: "6",
      name: "月均登录",
      value: Math.round(monthlyCount / 30),
      percentage: "-",
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* 标题行 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <h2 style={{ margin: 0 }}>登录人次统计</h2>
        </Col>
      </Row>

      {/* 统计数据卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Statistic
              title={
                <span>
                  <FieldTimeOutlined
                    style={{ marginRight: 8, color: "#1890ff" }}
                  />
                  今日登录
                </span>
              }
              value={dailyCount}
              valueStyle={{ color: "#1890ff", fontSize: 28 }}
              suffix="人次"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Statistic
              title={
                <span>
                  <CalendarOutlined
                    style={{ marginRight: 8, color: "#52c41a" }}
                  />
                  本周登录
                </span>
              }
              value={weeklyCount}
              valueStyle={{ color: "#52c41a", fontSize: 28 }}
              suffix="人次"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Statistic
              title={
                <span>
                  <CalendarOutlined
                    style={{ marginRight: 8, color: "#fa8c16" }}
                  />
                  本月登录
                </span>
              }
              value={monthlyCount}
              valueStyle={{ color: "#fa8c16", fontSize: 28 }}
              suffix="人次"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Statistic
              title={
                <span>
                  <FundOutlined style={{ marginRight: 8, color: "#722ed1" }} />
                  本年登录
                </span>
              }
              value={yearlyCount}
              valueStyle={{ color: "#722ed1", fontSize: 28 }}
              suffix="人次"
            />
          </Card>
        </Col>
      </Row>

      {/* 图表和统计表格区域 */}
      <Col span={24} style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          {/* 左侧：折线图 */}
          <Col xs={24} lg={14}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <h3 style={{ margin: "0 0 16px 0" }}>
                  <RiseOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                  登录趋势分析
                </h3>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card
                  bordered={false}
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                >
                  <div style={{ height: 400 }}>
                    <EChartsReact
                      option={lineChartOption}
                      showLoading={loading}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>

          {/* 右侧：统计表格 */}
          <Col xs={24} lg={10}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <h3 style={{ margin: "0 0 16px 0" }}>
                  <UserOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                  详细统计数据
                </h3>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card
                  bordered={false}
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                >
                  <Table
                    columns={statisticsColumns}
                    dataSource={statisticsData}
                    pagination={false}
                    size="small"
                    loading={loading}
                  />
                </Card>
              </Col>
            </Row>

            {/* 每日明细表格 */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card
                  bordered={false}
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                  title="每日明细"
                  extra={<Tag color="blue">近7日</Tag>}
                >
                  <Table
                    columns={columns}
                    dataSource={trendData}
                    pagination={false}
                    size="small"
                    loading={loading}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Col>
    </div>
  );
}
