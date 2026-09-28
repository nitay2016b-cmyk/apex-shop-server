package com.apexshop.ghostharvest.part;

import java.util.ArrayList;
import java.util.List;

/**
 * Packs/unpacks a List&lt;PartState&gt; into a single String so the network
 * payload can stay a plain fixed-arity record instead of needing a generic
 * list packet codec. Field values are all mod-controlled identifiers/numbers,
 * never player-supplied text, so the naive delimiter scheme is safe.
 */
public final class PartStateCodec {

	private static final String ENTRY_SEPARATOR = ";";
	private static final String FIELD_SEPARATOR = ",";

	private PartStateCodec() {
	}

	public static String encode(List<PartState> states) {
		StringBuilder builder = new StringBuilder();
		for (int i = 0; i < states.size(); i++) {
			if (i > 0) {
				builder.append(ENTRY_SEPARATOR);
			}
			PartState state = states.get(i);
			builder.append(state.id()).append(FIELD_SEPARATOR)
					.append(state.translationKey()).append(FIELD_SEPARATOR)
					.append(state.remaining()).append(FIELD_SEPARATOR)
					.append(state.instantKill() ? 1 : 0);
		}
		return builder.toString();
	}

	public static List<PartState> decode(String encoded) {
		List<PartState> result = new ArrayList<>();
		if (encoded == null || encoded.isEmpty()) {
			return result;
		}
		for (String entry : encoded.split(ENTRY_SEPARATOR)) {
			if (entry.isEmpty()) {
				continue;
			}
			String[] fields = entry.split(FIELD_SEPARATOR);
			if (fields.length != 4) {
				continue;
			}
			result.add(new PartState(fields[0], fields[1], Integer.parseInt(fields[2]), "1".equals(fields[3])));
		}
		return result;
	}
}
