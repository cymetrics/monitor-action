import * as React from "react";
import * as dayjs from "dayjs";

export const Footer: React.FC<{ date: Date }> = ({ date }) => (
  <div className="m-8">
    <p className="text-center">
      Last generated by{" "}
      <a
        href="https://github.com/floric/repo-monitor-action"
        className="font-bold"
      >
        <i className="fab fa-github"></i> floric/repo-monitor-action
      </a>{" "}
      on {dayjs(date).format("lll")}.
    </p>
  </div>
);
