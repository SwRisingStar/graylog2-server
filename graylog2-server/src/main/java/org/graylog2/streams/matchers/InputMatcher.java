/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
package org.graylog2.streams.matchers;

import org.graylog2.plugin.Message;
import org.graylog2.plugin.streams.StreamRule;

public class InputMatcher implements StreamRuleMatcher {

    @Override
    public boolean match(Message msg, StreamRule rule) {
       if(msg.getField(Message.FIELD_GL2_SOURCE_INPUT) == null) {
           return rule.getInverted();
       }
        final String value = msg.getField(Message.FIELD_GL2_SOURCE_INPUT).toString();
        return rule.getInverted() ^ value.trim().equalsIgnoreCase(rule.getValue());
    }
}
