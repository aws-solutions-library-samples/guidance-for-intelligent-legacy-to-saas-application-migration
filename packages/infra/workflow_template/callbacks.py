trace = {"agent_order": [], "agent_workflows": {}}


# https://strandsagents.com/0.1.x/user-guide/concepts/streaming/callback-handlers/#callback-handler-events
def capture_flow_callback(agent_name):
    def callback_handler(**kwargs):
        if "init_event_loop" in kwargs:
            trace["agent_order"].append(agent_name)
            trace["agent_workflows"][agent_name] = []
            print(kwargs)
        elif "start" in kwargs:
            pass
        elif "start_event_loop" in kwargs:
            pass
        elif "event" in kwargs:
            pass
        elif "delta" in kwargs:
            pass
        else:
            trace["agent_workflows"][agent_name].append(kwargs)
            print(kwargs)

    return callback_handler
